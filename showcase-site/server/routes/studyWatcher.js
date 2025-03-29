// server/routes/studyWatcher.js
import express from 'express';
import { spawn } from 'child_process';
const router = express.Router();
let pythonProcess = null;


// Start watching
router.post('/start-watch', (req, res) => {
    pythonProcess = spawn('python', ['detect_phone.py']);

    pythonProcess.stdout.on('data', (data) => {
        const result = JSON.parse(data.toString());
        req.app.locals.phoneDetected = result.phoneDetected;
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    res.json({ message: 'Study mode started. Monitoring phone usage...' });
});

// Stop watching
router.post('/stop-watch', (req, res) => {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
    }
    res.json({ message: 'Study mode stopped.' });
});

// Get current phone detection status
router.get('/status', (req, res) => {
    res.json({ phoneDetected: req.app.locals.phoneDetected || false });
});

export default router;
