import {Field, ID, InputType, ObjectType} from "type-graphql";
import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@ObjectType()
@Entity("Table")
export class Table {
    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    tableName: string;

    @Field()
    @Column()
    description: string;
}

@InputType()
export class TableInput {
    @Field()
    tableName: string;
    @Field()
    description: string;
}
