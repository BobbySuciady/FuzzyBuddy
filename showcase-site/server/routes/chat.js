// server/routes/chat.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ChatGPT Interaction
router.post('/', async (req, res) => {
    const { prompt } = req.body;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        const chatResponse = response.data.choices[0].message.content;
        res.json({ response: chatResponse });
    } catch (error) {
        console.error("Error communicating with ChatGPT:", error.message);
        res.status(500).json({ error: "Error communicating with ChatGPT" });
    }
});

module.exports = router;
