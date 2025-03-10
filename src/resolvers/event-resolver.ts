import {AppDataSource} from "../connection/datasource.js";
import {In, Repository} from "typeorm";
import {Artist} from '../types/Artist.js';
import {EventInput, Event} from "../types/Event.js";
import {Venue} from "../types/Venue.js";
import {Arg, Authorized, FieldResolver, ID, Mutation, Query, Resolver, Root} from "type-graphql";

@Resolver(of => Event)
export class EventResolver {

  private eventRepository: Repository<Event> = AppDataSource.getRepository(Event);
  private venueRepository: Repository<Venue> = AppDataSource.getRepository(Venue);
  private artistRepository: Repository<Artist> = AppDataSource.getRepository(Artist);

  //@Authorized()
  @Query(returns => [Event])
  async events() {
    return await this.eventRepository.find({order: {id: "DESC"}})
  }

  @FieldResolver(returns => Venue)
  async venue(@Root() event: Event): Promise<Venue> {
    return this.venueRepository.findOneBy({id: event.venueId})
  }

  @FieldResolver(returns => [Artist])
  artists(@Root() event: Event): Promise<Artist[]> {
    return this.artistRepository.find({relations: ['events'], where: {events: {id: event.id}}});
  }

  @Query(returns => Event)
  event(@Arg("id", type => ID) id: number): Promise<Event> {
    return this.eventRepository.findOneBy({id})
  }

  @Authorized("ROLE_ADMIN")
  @Mutation(returns => Event)
  async createEvent(@Arg("eventInput") eventInput: EventInput): Promise<Event> {
    const event = new Event();
    event.name = eventInput.name;
    event.description = eventInput.description;
    event.eventDate = new Date(eventInput.eventDate);
    event.category = eventInput.category;
    event.imageUrl = eventInput.imageUrl;
    event.venueId = eventInput.venueId;
    event.artists = await this.artistRepository.find({where: {id: In(eventInput.artistIds)}});
    return this.eventRepository.save(event);
  }

}