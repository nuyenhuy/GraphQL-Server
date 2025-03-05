import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity("Review")
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    rating: number;

    @Column({nullable: true})
    comment?: string;

    @Column()
    userId: number;

    @Column()
    eventId: number;
}