import {Field, ID, Int, ObjectType} from "type-graphql";
import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import {Booking} from "../types/Booking.js";


@ObjectType()
@Entity("Ticket")
class Ticket {
    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Int)
    @Column()
    seatNo: number;

    @Field(type => Int)
    @Column()
    bookingId: number;

    @Field(type => Booking)
    @ManyToOne(() => Booking, booking => booking.id)
    @JoinColumn({name: 'bookingId'})
    booking: Relation<Booking>;
}

export {Ticket}

