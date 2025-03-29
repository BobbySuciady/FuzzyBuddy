// server/routes/calendar.js
const express = require('express');
const { google } = require('googleapis');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();
const OpenAI = require("openai");

const client = new OpenAI();


const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Store tokens and calendar data for each user (in-memory for now)
const userTokens = {};
const userCalendarData = {};

// Step 1: Get authentication URL
router.get('/auth', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar']
    });
    res.redirect(authUrl);
});

// Step 2: Handle Google OAuth redirect and get tokens + fetch calendar data
router.get('/redirect', async (req, res) => {
    const code = req.query.code;
    const userId = 'test_user'; // Temporary userID for testing

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Store user's tokens
        userTokens[userId] = tokens;

        // Fetch and store user's calendar data for the next 2 weeks
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: twoWeeksFromNow.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        // Store the fetched events in memory for the user
        userCalendarData[userId] = response.data.items;

        res.redirect('http://localhost:5173/');  // Redirect to your React app after successful authentication
    } catch (error) {
        console.error('Error during authentication or fetching calendar events:', error.message);
        res.status(500).json({ error: 'Authentication failed or failed to fetch events' });
    }
});

router.post('/chat', async (req, res) => {
    const userId = 'test_user';  // Temporary userID for testing
    const { prompt } = req.body;

    if (!userCalendarData[userId]) {
        return res.status(404).json({ error: 'No calendar data found for this user.' });
    }

    // Prepare the data to be sent to ChatGPT
    const calendarData = userCalendarData[userId];
    const formattedEvents = calendarData.map(event => ({
        summary: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date
    }));

    const calendarInfo = JSON.stringify(formattedEvents);

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant that has access to the user's calendar events." },
                { role: "user", content: `${prompt}\n\nUser's Calendar Data: ${calendarInfo}` }
            ],
        });

        const chatResponse = completion.choices[0].message.content;
        res.json({ response: chatResponse });
    } catch (error) {
        if (error.response) {
            console.error('Error communicating with ChatGPT:', error.response.data);
        } else {
            console.error('Error communicating with ChatGPT:', error.message);
        }
        res.status(500).json({ error: 'Failed to get response from ChatGPT' });
    }
});

module.exports = router;
