import "reflect-metadata"
import {DataSource} from "typeorm"
import {AdjCustomer} from "../types/AdjCustomer.js";
import {Booking} from "../types/Booking.js";
import {Ticket} from "../types/Ticket.js";
import {User} from "../types/User.js";
import {Venue} from "../types/Venue.js";
import {Artist} from "../types/Artist.js";
import {Review} from "../types/Review.js";
import {DimCustomer} from "../types/DimCustomer.js";
import {Event} from "../types/Event.js";
import {Table} from "../types/Table.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "123456",
    database: "events",
    entities: [Event, Booking, Ticket, User, Venue, Artist, Review, AdjCustomer, DimCustomer, Table],
    synchronize: true,
    logging: true,
});

AppDataSource.initialize()
    .then(() => {
        console.log("Database connected")
    })
    .catch((error) => console.log(error))