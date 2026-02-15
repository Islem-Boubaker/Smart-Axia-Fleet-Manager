import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.route.js';
import vehicleRoutes from './routes/vehicle.route.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();


const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

app.use('/', [userRoutes, vehicleRoutes]);
app.use(errorHandler);

export default app;

