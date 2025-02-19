import "reflect-metadata"
import { Event, Artist, Booking, Review, Ticket, User, Venue } from "../types/types.js"
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "123456",
    database: "events",
    entities: [Event, Booking, Ticket, User, Venue, Artist, Review],
    synchronize: true,
    logging: true,
});

AppDataSource.initialize()
    .then(() => {
        console.log("Database connected")
    })
    .catch((error) => console.log(error))