import {Field, ID, InputType, ObjectType} from "type-graphql";
import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@ObjectType()
@Entity("User")
export class User {

    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    password: string;

    @Field()
    @Column()
    role: string;
}

@InputType()
export class UserInput {
    @Field()
    name: string;
    @Field()
    email: string;
    @Field()
    password: string;
    @Field({nullable: true})
    role?: string;
}

@InputType()
export class LoginInput {
    @Field()
    email: string;
    @Field()
    password: string;
}

@ObjectType()
export class LoginToken {
    @Field()
    accessToken: string;
    @Field()
    refreshToken: string;
}

export class UserContext {
    name: string;
    id: number;
    role: string;
}

export class AppContext {
    userContext?: UserContext;
}