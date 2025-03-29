import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import taskRoutes from './routes/tasks.js';
import petRoutes from './routes/pet.js';
import chatRoutes from './routes/chat.js';
import calendarRoutes from './routes/calendar.js';
import studyWatcherRoutes from './routes/studyWatcher.js';

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Use routes
app.use('/api/tasks', taskRoutes);
app.use('/api/pet', petRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/study-watcher', studyWatcherRoutes);

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});
