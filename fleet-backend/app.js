// ─────────────────────────────────────────────────────────────
//  Express application — production security configuration
// ─────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import userRoutes from './routes/user.route.js';
import vehicleRoutes from './routes/vehicle.route.js';
import reclamationRoutes from './routes/reclamation.route.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { CORS_OPTIONS, HELMET_OPTIONS, RATE_LIMIT } from './config/security.js';

dotenv.config();

const app = express();

// ── 1. CORS — must run BEFORE helmet so preflight OPTIONS gets headers ─
app.use(cors(CORS_OPTIONS));

// ── 2. Security headers (Helmet) ────────────────────────────
//    Sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
//    X-XSS-Protection, Referrer-Policy, and more.
app.use(helmet(HELMET_OPTIONS));

// ── 3. Global rate limiter (DDoS / abuse protection) ─────────
app.use(rateLimit(RATE_LIMIT.api));



// ── 4. Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // cap payload size
app.use(express.urlencoded({ extended: false }));

// ── 5. Cookie parser — required to read httpOnly cookies ─────
app.use(cookieParser());

// ── 6. Remove fingerprinting header ──────────────────────────
app.disable('x-powered-by');

app.set("trust proxy", 1);
// ── 7. Routes ────────────────────────────────────────────────
app.use('/', [userRoutes, vehicleRoutes, reclamationRoutes]);

// ── 8. Global error handler ──────────────────────────────────
app.use(errorHandler);

export default app;

