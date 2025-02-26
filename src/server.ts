import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express, {NextFunction} from 'express';
import { AppContext, UserContext } from './types/types.js';
import { EventResolver } from './resolvers/event-resolver.js';
import { AuthChecker, buildSchema } from 'type-graphql';
import { VenueResolver } from './resolvers/venue-resolver.js';
import { UserResolver } from './resolvers/user-resolver.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './constants/constants.js';
import { BookingResolver } from './resolvers/booking-resolver.js';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { mergeSchemas } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { subScriptionSchema } from './subScriptionSchema.js';
import { ArtistResolver } from './resolvers/artist-resolver.js';
import {DimCustomerResolver} from "./resolvers/dim-customer-resolver.js";
import {AdjCustomerResolver} from "./resolvers/adj-customer-resolver.js";
import {TableResolver} from "./resolvers/table-resolver.js";
import multer from "multer";
const PORT = 3001;
const app = express();

const httpServer = createServer(app);

const authChecker: AuthChecker<AppContext> = ({ context },roles) => {
  return context?.userContext?.id &&
    (roles.length===0 || roles.includes(context.userContext.role));
};

const typeGraphQLSchema = await buildSchema({
    resolvers: [EventResolver,VenueResolver,UserResolver,BookingResolver,ArtistResolver,DimCustomerResolver,AdjCustomerResolver,TableResolver],
    emitSchemaFile: true,
    authChecker
});

const schema = mergeSchemas({schemas: [typeGraphQLSchema,subScriptionSchema]});

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer({ 
  schema, 
  onConnect: (context) => {
    const authorization = context.connectionParams.Authorization || '';
    try {
        const userContext = jwt.verify(authorization, JWT_SECRET);
        return {userContext};
    }
    catch (e) {
      throw new Error('Not authenticated');          
    }
},
}, wsServer);
    
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],

});

await server.start();

const options =   {
  context:
    async ({ req }):Promise<AppContext> => {
      const token = req.headers.authorization || '';
      try {
        const userContext:UserContext = jwt.verify(token, JWT_SECRET);
        return {userContext};
      } catch (e) {
        return {userContext:null};
      }     
    }
  };

app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, options)
);
httpServer.listen({ port: PORT }, () => {
  console.log(`Server ready at http://localhost:${PORT}/graphql`)
});

// Cấu hình multer để lưu file tạm thời
const upload = multer({ dest: 'uploads/' });

import { Request, Response } from 'express';
import path from "path";
import fs from "fs";

// Middleware handler mà không cần trả về giá trị
const uploadHandler = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
        res.status(400).send('No file uploaded');
        return;
    }

    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // Kiểm tra nếu file đã tồn tại trong thư mục uploads (nếu cần update)
    if (fs.existsSync(filePath)) {
        // Nếu file đã tồn tại, có thể xóa hoặc thay thế nó
        fs.unlinkSync(filePath);  // Xóa file cũ (hoặc có thể thay thế)
    }

    // Tiến hành lưu file mới vào thư mục hoặc thực hiện bất kỳ thao tác nào khác
    fs.writeFileSync(filePath, req.file.buffer);  // Lưu file vào thư mục uploads (nếu cần)

    // Gửi phản hồi thành công
    res.status(200).send({
        message: 'File uploaded and updated successfully',
        file: req.file,
    });
};

// Đảm bảo sử dụng middleware đúng cách
app.post('/upload', uploadHandler);