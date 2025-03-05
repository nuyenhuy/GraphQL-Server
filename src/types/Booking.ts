import {Field, Float, ID, InputType, Int, ObjectType} from "type-graphql";
import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation} from "typeorm";
import {Event} from "../types/Event.js";
import {Ticket} from "../types/Ticket.js";

@ObjectType()
@Entity("Booking")
class Booking {
    @Field((type) => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field((type) => Date)
    @Column()
    bookingDate: Date;

    @Field((type) => Int)
    @Column()
    userId: number;

    @Field((type) => Int)
    @Column()
    eventId: number;

    @Field((type) => Event)
    @ManyToOne(() => Event, (event) => event.id)
    @JoinColumn({name: "eventId"})
    event?: Relation<Event>;

    @Field((type) => Float)
    @Column()
    price: number;

    @Field((type) => [Ticket])
    @OneToMany(() => Ticket, (ticket) => ticket.bookingId)
    tickets: Ticket[];
}

@InputType()
class BookingInput {
    @Field(type => Int)
    eventId: number;
    @Field(type => [Int])
    seats: number[];
}

export {Booking, BookingInput}
