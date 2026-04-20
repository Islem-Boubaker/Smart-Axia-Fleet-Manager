import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import "./events/notification.handlers.js";
import { CORS_OPTIONS, HELMET_OPTIONS, RATE_LIMIT } from './config/security.js';
import { initializeRedis } from './config/connectdb.js';
import userRoutes from './routes/user.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import reclamationRoutes from './routes/reclamation.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import tripRoutes from './routes/trip.routes.js';
import tripStopRoutes from './routes/tripStop.routes.js';
dotenv.config();

initializeRedis().catch((error) => {
	console.error('[Redis] Initialization warning:', error.message);
});

const app = express();
const apiLimiter = rateLimit({
	...RATE_LIMIT.api,
	skip: (req) => req.method === 'GET',
});

app.use(cors(CORS_OPTIONS));
app.use(helmet(HELMET_OPTIONS));
app.use(apiLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.disable('x-powered-by');
app.set("trust proxy", 1);
app.use('/', [userRoutes, vehicleRoutes, reclamationRoutes, maintenanceRoutes, notificationRoutes,tripRoutes,tripStopRoutes]);

app.use(errorHandler);
export default app;




