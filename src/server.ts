// External libraries
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import {ApolloServer, BaseContext} from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { mergeSchemas } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { JWT_SECRET } from './constants/constants.js';
import { AppContext, UserContext } from './types/types.js';
import { buildSchema, AuthChecker } from 'type-graphql';
import { subScriptionSchema } from './subScriptionSchema.js';
import uploadRoutes from './routers/upload.routes.js';

import { EventResolver } from './resolvers/event-resolver.js';
import { VenueResolver } from './resolvers/venue-resolver.js';
import { UserResolver } from './resolvers/user-resolver.js';
import { BookingResolver } from './resolvers/booking-resolver.js';
import { ArtistResolver } from './resolvers/artist-resolver.js';
import { DimCustomerResolver } from './resolvers/dim-customer-resolver.js';
import { AdjCustomerResolver } from './resolvers/adj-customer-resolver.js';
import { TableResolver } from './resolvers/table-resolver.js';
import {GraphQLSchema} from "graphql/type";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";

// Setup server paths
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);
const PORT = 3001;
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
app.use(cors());
app.use(express.json());

// Authentication checker for GraphQL
const authChecker: AuthChecker<AppContext> = ({ context }, roles) => {
  return context?.userContext?.id && (roles.length === 0 || roles.includes(context.userContext.role));
};

// Build GraphQL Schema
const typeGraphQLSchema: GraphQLSchema = await buildSchema({
  resolvers: [EventResolver, VenueResolver, UserResolver, BookingResolver, ArtistResolver, DimCustomerResolver, AdjCustomerResolver, TableResolver],
  emitSchemaFile: true,
  authChecker
});

const schema: GraphQLSchema = mergeSchemas({ schemas: [typeGraphQLSchema, subScriptionSchema] });

// Setup WebSocket Server
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
const serverCleanup = useServer({
  schema,
  onConnect: (context) => {
    const authorization = context.connectionParams.Authorization || '';
    try {
      const userContext = jwt.verify(authorization, JWT_SECRET);
      return { userContext };
    } catch (e) {
      throw new Error('Not authenticated');
    }
  },
}, wsServer);

// Initialize Apollo Server
const server: ApolloServer<BaseContext> = new ApolloServer({
  schema,
  csrfPrevention: false, // Tắt CSRF protection
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return { async drainServer() { await serverCleanup.dispose(); } };
      },
    },
  ],
});
await server.start();

// GraphQL middleware
app.use("/graphql", expressMiddleware(server, {
  context: async ({ req }): Promise<AppContext> => {
    const token: string = req.headers.authorization || '';
    try {
      const userContext: UserContext = jwt.verify(token, JWT_SECRET);
      return { userContext };
    } catch (e) {
      return { userContext: null };
    }
  }
}));

// API routes
app.use('/api', uploadRoutes);

// Start HTTP server
httpServer.listen(PORT, (): void => {
  console.log(`Server ready at http://localhost:${PORT}/graphql`);
});