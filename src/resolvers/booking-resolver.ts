import {AppContext} from "../types/User.js";
import {Booking, BookingInput} from "../types/Booking.js";
import {Ticket} from "../types/Ticket.js";
import {Venue} from "../types/Venue.js";
import {Event, EventSeatAvailability} from "../types/Event.js";
import {AppDataSource} from "../connection/datasource.js";
import {Repository} from "typeorm";
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import {pubSub} from "../pub-sub.js";
import {EVENT_BOOKING_CREATED} from "../constants/constants.js";

@Resolver((of) => Booking)
export class BookingResolver {
  private bookingRepository: Repository<Booking> =
    AppDataSource.getRepository(Booking);
  private ticketRepository: Repository<Ticket> =
    AppDataSource.getRepository(Ticket);
  private eventRepository: Repository<Event> =
    AppDataSource.getRepository(Event);
  private venueRepository: Repository<Venue> =
    AppDataSource.getRepository(Venue);
  private eventAvailabilityMap = new Map<number, EventSeatAvailability>();

  @Query((returns) => [Booking])
  @Authorized()
  bookings(
    @Arg("eventId") eventId: number,
    @Ctx() ctx: AppContext
  ): Promise<Booking[]> {
    const isUserAdmin = ctx.userContext?.role === "ROLE_ADMIN";
    if (isUserAdmin) {
      return this.bookingRepository.find({where: {eventId}});
    } else {
      return this.bookingRepository.find({
        where: {eventId, userId: ctx.userContext?.id},
      });
    }
  }

  @Query((returns) => [Booking])
  @Authorized()
  allBookings(
    @Ctx() ctx: AppContext
  ): Promise<Booking[]> {
    const isUserAdmin = ctx.userContext?.role === "ROLE_ADMIN";
    if (isUserAdmin) {
      return this.bookingRepository.find();
    } else {
      return this.bookingRepository.find({
        where: {userId: ctx.userContext?.id},
      });
    }
  }

  @FieldResolver((returns) => [Ticket])
  tickets(@Root() booking: Booking): Promise<Ticket[]> {
    return this.ticketRepository.find({where: {bookingId: booking.id}});
  }

  @FieldResolver((returns) => Event)
  event(@Root() booking: Booking): Promise<Event> {
    return this.eventRepository.findOneBy({id: booking.eventId})
  }

  @Mutation((returns) => Booking)
  @Authorized()
  async createBooking(
    @Arg("bookingInput") bookingInput: BookingInput,
    @Ctx() ctx: AppContext
  ): Promise<Booking> {
    const booking = new Booking();
    booking.eventId = bookingInput.eventId;
    booking.userId = ctx.userContext?.id;
    booking.bookingDate = new Date();
    booking.price = 50 * bookingInput.seats.length;
    return await AppDataSource.manager.transaction(
      async (transactionalEntityManager) => {
        const savedBooking = await transactionalEntityManager.save(booking);
        const tickets: Ticket[] = bookingInput.seats.map((seat) => {
          const ticket = new Ticket();
          ticket.bookingId = savedBooking.id;
          ticket.seatNo = seat;
          return ticket;
        });
        await transactionalEntityManager.save(tickets);
        savedBooking.tickets = tickets;
        const eventSeatAvailability: EventSeatAvailability =
          await this.getUpdatedEventSeatAvailability(savedBooking);
        await pubSub.publish(EVENT_BOOKING_CREATED, {
          eventSeatAvailabilityNotification: eventSeatAvailability,
        });

        return savedBooking;
      }
    );
  }

  private async getUpdatedEventSeatAvailability(
    newBooking: Booking
  ): Promise<EventSeatAvailability> {
    let eventSeatAvailability = this.eventAvailabilityMap.get(
      newBooking.eventId
    );
    if (eventSeatAvailability) {
      eventSeatAvailability.seatsAvailable =
        eventSeatAvailability.seatsAvailable - newBooking.tickets.length;
      eventSeatAvailability.seatNos = eventSeatAvailability.seatNos.filter(
        (seat) =>
          !newBooking.tickets.map((ticket) => ticket.seatNo).includes(seat)
      );
    } else {
      const event = await this.eventRepository.findOneBy({
        id: newBooking.eventId,
      });
      const venue = await this.venueRepository.findOneBy({id: event.venueId});
      const bookings = await this.bookingRepository.find({
        where: {eventId: newBooking.eventId},
        relations: ["tickets"],
      });
      const bookedSeats = bookings
        .map((booking) => booking.tickets.map((ticket) => ticket.seatNo))
        .flat();
      bookedSeats.push(...newBooking.tickets.map((ticket) => ticket.seatNo));
      eventSeatAvailability = {
        eventId: newBooking.eventId,
        seatsAvailable: venue.capacity - bookedSeats.length,
        seatNos: Array.from({length: venue.capacity}, (_, i) => i + 1).filter(
          (seat) => !bookedSeats.includes(seat)
        ),
      };
    }
    this.eventAvailabilityMap.set(newBooking.eventId, eventSeatAvailability);
    return eventSeatAvailability;
  }

  @Query((returns) => EventSeatAvailability)
  async eventSeatAvailability(
    @Arg("eventId") eventId: number
  ): Promise<EventSeatAvailability> {
    const event = await this.eventRepository.findOneBy({
      id: eventId,
    });
    const venue = await this.venueRepository.findOneBy({
      id: event.venueId,
    });
    const bookings = await this.bookingRepository.find({
      where: {eventId},
      relations: ["tickets"],
    });
    const bookedSeats = bookings
      .map((booking) => booking.tickets.map((ticket) => ticket.seatNo))
      .flat();
    const eventSeatAvailability = {
      eventId,
      seatsAvailable: venue.capacity - bookedSeats.length,
      seatNos: Array.from({length: venue.capacity}, (_, i) => i + 1).filter(
        (seat) => !bookedSeats.includes(seat)
      ),
    };
    return eventSeatAvailability;
  }
}
