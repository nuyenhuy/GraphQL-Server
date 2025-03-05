import {Field, ID, ObjectType} from "type-graphql";
import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Event} from "../types/Event.js";

@ObjectType()
@Entity("Artist")
export class Artist {
    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    bio: string;

    @Field()
    @Column({nullable: true})
    imageUrl?: string;

    @Field(type => [Event])
    @ManyToMany(() => Event, (event) => event.artists)
    events: Event[];
}