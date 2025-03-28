// server/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Import routes
const taskRoutes = require('./routes/tasks');
const petRoutes = require('./routes/pet');
const chatRoutes = require('./routes/chat');
const calendarRoutes = require('./routes/calendar')

// Use routes
app.use('/api/tasks', taskRoutes);
app.use('/api/pet', petRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
