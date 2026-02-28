import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import usersRouter from './routes/users';
import journeysRouter from './routes/journeys';
import leaderboardsRouter from './routes/leaderboards';
import achievementsRouter from './routes/achievements';
import goalsRouter from './routes/goals';
import authRouter from './routes/auth';
import locationsRouter from './routes/locations';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api', usersRouter);
app.use('/api', journeysRouter);
app.use('/api', leaderboardsRouter);
app.use('/api', achievementsRouter);
app.use('/api', goalsRouter);
app.use('/api', authRouter);
app.use('/api', locationsRouter);

app.listen(PORT, () => {
  console.log(`🌱 Core29 Sustainability API running on http://localhost:${PORT}`);
});

export default app;
