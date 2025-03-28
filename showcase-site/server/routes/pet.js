// server/routes/pet.js
const express = require('express');
const router = express.Router();

let happinessLevel = 50;  // Initial happiness level

// Get happiness level
router.get('/happiness', (req, res) => {
    res.json({ happinessLevel });
});

// Update happiness (e.g., drinking water or eating)
router.post('/update-happiness', (req, res) => {
    const { amount } = req.body;
    happinessLevel += amount;  // Increase happiness by given amount
    res.json({ message: 'Happiness updated!', happinessLevel });
});

module.exports = router;
