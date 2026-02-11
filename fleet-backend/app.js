import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import startServer from './server.js';
import userRoutes from './routes/userRoute.js';
import  dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/users', userRoutes);

startServer(app, PORT);
