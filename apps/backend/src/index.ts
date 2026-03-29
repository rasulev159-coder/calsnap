import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';

import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import logsRouter from './routes/logs';
import foodRouter from './routes/food';
import menuRouter from './routes/menu';
import statsRouter from './routes/stats';
import aiRouter from './routes/ai';
import workoutRouter from './routes/workout';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/logs', logsRouter);
app.use('/api/food', foodRouter);
app.use('/api/menu', menuRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/workout', workoutRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 CalSnap API running on http://localhost:${PORT}`);
});

export default app;
