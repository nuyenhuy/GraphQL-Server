import {ApolloServer} from '@apollo/server';
import {expressMiddleware} from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import {AdjCustomer, AppContext, UserContext} from './types/types.js';
import {EventResolver} from './resolvers/event-resolver.js';
import {AuthChecker, buildSchema} from 'type-graphql';
import {VenueResolver} from './resolvers/venue-resolver.js';
import {UserResolver} from './resolvers/user-resolver.js';
import jwt from 'jsonwebtoken';
import {JWT_SECRET} from './constants/constants.js';
import {BookingResolver} from './resolvers/booking-resolver.js';
import {createServer} from 'http';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import {mergeSchemas} from '@graphql-tools/schema';
import {WebSocketServer} from 'ws';
import {useServer} from 'graphql-ws/lib/use/ws';
import {subScriptionSchema} from './subScriptionSchema.js';
import {ArtistResolver} from './resolvers/artist-resolver.js';
import {DimCustomerResolver} from "./resolvers/dim-customer-resolver.js";
import {AdjCustomerResolver} from "./resolvers/adj-customer-resolver.js";
import {TableResolver} from "./resolvers/table-resolver.js";
import {AppDataSource} from "./connection/datasource.js";

import {fileURLToPath} from 'url';
import {dirname} from 'path';
import multer from 'multer';
import path from "path";
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// import multer from "multer";
const PORT = 3001;
const app = express();
app.use(cors())
const httpServer = createServer(app);

const authChecker: AuthChecker<AppContext> = ({context}, roles) => {
  return context?.userContext?.id &&
    (roles.length === 0 || roles.includes(context.userContext.role));
};

const typeGraphQLSchema = await buildSchema({
  resolvers: [EventResolver, VenueResolver, UserResolver, BookingResolver, ArtistResolver, DimCustomerResolver, AdjCustomerResolver, TableResolver],
  emitSchemaFile: true,
  authChecker
});

const schema = mergeSchemas({schemas: [typeGraphQLSchema, subScriptionSchema]});

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
    } catch (e) {
      throw new Error('Not authenticated');
    }
  },
}, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({httpServer}),
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

const options = {
  context:
    async ({req}): Promise<AppContext> => {
      const token = req.headers.authorization || '';
      try {
        const userContext: UserContext = jwt.verify(token, JWT_SECRET);
        return {userContext};
      } catch (e) {
        return {userContext: null};
      }
    }
};

app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, options)
);
httpServer.listen({port: PORT}, () => {
  console.log(`Server ready at http://localhost:${PORT}/graphql`)
});

// Cấu hình multer để lưu file tạm thời
const upload = multer({dest: 'uploads/'});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({error: 'No file uploaded'});
  }

  // Kiểm tra định dạng file
  const allowedExtensions = ['.xls', '.xlsx'];
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({error: 'Invalid file format. Only .xls and .xlsx allowed'});
  }

  try {
    // Đọc dữ liệu từ file Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // Chuyển dữ liệu thành danh sách AdjCustomer
    let customers = jsonData.map((row: any) => {
      return {
        customerId: row.customerId,
        name: row.name,
        address: row.address,
        phone: row.phone,
        email: row.email,
        createAt: new Date(row.createAt), // Chuyển đổi ngày tháng
        isMerge: row.isMerge === 'TRUE' // Chuyển boolean
      };
    });

    customers = customers.filter(customer => customer.customerId != undefined);
    const customerRepo = AppDataSource.getRepository(AdjCustomer);
    await customerRepo.save(customers);
    res.json({message: 'File processed successfully', totalRecords: customers.length});
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});
