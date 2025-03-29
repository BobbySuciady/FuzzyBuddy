import express from 'express';
const router = express.Router();

let tasks = [];

// Get all tasks
router.get('/', (req, res) => {
    res.json({ tasks });
});

// Add a task
router.post('/', (req, res) => {
    const { id, name } = req.body;
    tasks.push({ id, name, completed: false });
    res.json({ message: 'Task added!', tasks });
});

// Complete a task
router.put('/:id', (req, res) => {
    const { id } = req.params;
    tasks = tasks.map(task => 
        task.id === parseInt(id) ? { ...task, completed: true } : task
    );
    res.json({ message: 'Task completed!', tasks });
});

export default router;
