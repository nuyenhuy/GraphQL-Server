import {Field, ID, InputType, Int, ObjectType} from "type-graphql";
import {Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import {Artist} from "../types/Artist.js";
import {Venue} from "../types/Venue.js";

@ObjectType()
@Entity("Event")
export class Event {

    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    description: string;

    @Field(type => Date)
    @Column()
    eventDate: Date;

    @Field()
    @Column({nullable: true})
    category: string;

    @Field()
    @Column({nullable: true})
    imageUrl?: string;

    @Field(type => Int)
    @Column()
    venueId: number;

    @Field(type => Venue)
    @ManyToOne(() => Venue, (venue) => venue.id)
    @JoinColumn({name: 'venueId'})
    venue?: Relation<Venue>;

    @Field(type => [Artist])
    @ManyToMany(() => Artist, (artist) => artist.events)
    @JoinTable({name: "Event_Artist"})
    artists: Artist[];
}

@InputType()
export class EventInput {
    @Field()
    name: string;

    @Field()
    description: string;

    @Field()
    eventDate: string;

    @Field()
    category: string;

    @Field({nullable: true})
    imageUrl?: string;

    @Field(type => Int)
    venueId: number;

    @Field(type => [Int])
    artistIds: number[];
}

@ObjectType()
export class EventSeatAvailability {
    @Field(type => Int)
    eventId: number;
    @Field(type => Int)
    seatsAvailable: number;
    @Field((type) => [Int])
    seatNos: number[];
}