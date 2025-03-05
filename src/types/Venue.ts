import {Field, ID, InputType, Int, ObjectType} from "type-graphql";
import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Event} from "../types/Event.js";

@ObjectType()
@Entity("Venue")
export class Venue {

    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    address: string;

    @Field()
    @Column()
    location: string;

    @Field(type => Int)
    @Column()
    capacity: number;

    @Field(type => [Event])
    @OneToMany(() => Event, (event) => event.venueId)
    events: Event[];
}

@InputType()
export class VenueInput {
    @Field()
    name: string;
    @Field()
    address: string;
    @Field()
    location: string;
    @Field()
    capacity: number;
}