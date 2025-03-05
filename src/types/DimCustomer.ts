import {Field, ID, InputType, ObjectType} from "type-graphql";
import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@ObjectType()
@Entity("DimCustomer")
export class DimCustomer {
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
    validStart: Date;

    @Field({nullable: true})
    @Column({nullable: true})
    validEnd: Date;

    @Field()
    @Column()
    isCurrent: boolean;
}

@InputType()
export class DimCustomerInput {
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
    validStart: Date;
    @Field()
    validEnd: Date;
    @Field()
    isCurrent: boolean;
}