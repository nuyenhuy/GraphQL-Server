import {Field, ID, InputType, ObjectType} from "type-graphql";
import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@ObjectType()
@Entity("AdjCustomer")
export class AdjCustomer {
    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    customerId: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    address: string;

    @Field()
    @Column()
    phone: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    createAt: Date;

    @Field()
    @Column()
    isMerge: boolean;
}

@InputType()
export class AdjCustomerInput {
    @Field()
    customerId: string;
    @Field()
    name: string;
    @Field()
    address: string;
    @Field()
    phone: string;
    @Field()
    email: string;
    @Field()
    createAt: Date;
    @Field()
    isMerge: boolean;
}