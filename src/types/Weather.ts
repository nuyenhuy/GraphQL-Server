import {Field, Float, ObjectType} from "type-graphql";

@ObjectType()
export class Weather {
    @Field((type) => Float)
    temp: number;
    @Field((type) => Float)
    feels_like: number;
    @Field((type) => Float)
    temp_min: number;
    @Field((type) => Float)
    temp_max: number;
    @Field((type) => Float)
    humidity: number;
    @Field()
    description: string;
    @Field()
    main: string;
    @Field()
    icon: string;
    @Field()
    windSpeed: string;
}