import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import startServer from './server.js';
import userRoutes from './routes/user.route.js';
import { errorHandler } from './middlewares/error.middleware.js';
import  dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(errorHandler);

app.use('/', [userRoutes]);

startServer(app, PORT);
