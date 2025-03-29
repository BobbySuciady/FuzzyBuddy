import express from 'express';
import { google } from 'googleapis';
import axios from 'axios';
import { config } from 'dotenv';
import { OpenAI } from 'openai';

config();
const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const userSessions = {}; // Store per-user chat history + collected JSON

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const userTokens = {};
const userCalendarData = {};

router.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar']
  });
  res.redirect(authUrl);
});

router.get('/redirect', async (req, res) => {
  const code = req.query.code;
  const userId = 'test_user';

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    userTokens[userId] = tokens;

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: twoWeeksFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    userCalendarData[userId] = response.data.items;
    res.redirect('http://localhost:5173/');
  } catch (error) {
    console.error('OAuth error:', error.message);
    res.status(500).json({ error: 'Authentication failed or failed to fetch events' });
  }
});

router.post('/chat', async (req, res) => {
  const userId = 'test_user';
  const { prompt } = req.body;

  if (!userCalendarData[userId]) {
    return res.status(404).json({ error: 'No calendar data found for this user.' });
  }

  if (!userSessions[userId]) {
    userSessions[userId] = {
      history: [],
      eventCreated: false
    };
  }

  const session = userSessions[userId];
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = {
    role: "system",
    content: `
You are a smart, friendly calendar assistant. You help users create events in their Google Calendar by having a natural conversation.

Today’s date is ${today}. Use this as a reference when interpreting natural language like “today,” “tomorrow,” or “next Monday.”

You should infer as much as you can from the user’s prompt, especially the event name and description.
- If the event name seems obvious, use it (e.g. “study session with friends at 8pm”).
- If a description is implied or can be written from context, write it.
- Only ask for a detail if it is clearly missing or truly ambiguous.

Only ask ONE question at a time. No lists. Never overwhelm the user.

Gather these details step-by-step:
- Event name
- Start and end time (natural language OK)
- Description (include whether it's Priority: Compulsory or Optional)
- Reminder (ask: popup/email/both, and how many minutes before)
- Recurrence (ask: does it repeat daily, weekly, etc.)

✅ Never show technical data (like JSON, ISO strings, timestamps) to the user.

✅ When all event info is collected:
1. Confirm the event in friendly, human words.
2. Then output only this special tag block so the backend can create it:

<event>
{
  "summary": "Example Event",
  "start": "2025-04-01T21:00:00",
  "end": "2025-04-01T22:00:00",
  "description": "Something important. Priority: Compulsory",
  "reminders": [
    { "method": "email", "minutes": 30 },
    { "method": "popup", "minutes": 15 }
  ],
  "recurrence": ["RRULE:FREQ=WEEKLY"]
}
</event>

❌ Never say “here is the JSON” or anything like that.

If the user says “cancel” or “never mind”, stop everything.`
  };

  session.history.push({ role: "user", content: prompt });

  try {
    const messages = [systemPrompt, ...session.history];

    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages
    });

    const reply = completion.choices[0].message.content;
    console.log("GPT reply:", reply);

    session.history.push({ role: "assistant", content: reply });

    const eventRegex = /<event>\s*({[\s\S]+?})\s*<\/event>/gi;
    const matches = reply.matchAll(eventRegex);
    const events = [];

    for (const match of matches) {
      try {
        const eventObj = JSON.parse(match[1]);
        events.push(eventObj);
      } catch (err) {
        console.error("Failed to parse one event block");
      }
    }

    if (!events.length) {
      return res.json({ response: reply });
    }

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const responses = [];

    for (const parsedEvent of events) {
      const isCompulsory = parsedEvent.description?.toLowerCase().includes("priority: compulsory");
      const eventStart = new Date(parsedEvent.start);

      const existingCompulsories = userCalendarData[userId]
        .filter(e => (e.description || "").toLowerCase().includes("priority: compulsory"))
        .map(e => new Date(e.start.dateTime || e.start.date))
        .filter(date => date >= new Date())
        .sort((a, b) => a - b);

      const isSoonest = !existingCompulsories.length || eventStart <= existingCompulsories[0];

      const isDateOnly = !parsedEvent.start.includes('T');

      const start = isDateOnly
        ? { date: parsedEvent.start }
        : { dateTime: parsedEvent.start, timeZone: 'Australia/Melbourne' };

      const end = isDateOnly
        ? { date: parsedEvent.end }
        : { dateTime: parsedEvent.end, timeZone: 'Australia/Melbourne' };

      const newEvent = {
        summary: parsedEvent.summary,
        description: parsedEvent.description || "",
        start,
        end,
        colorId: isCompulsory ? (isSoonest ? "11" : "4") : "9",
        reminders: {
          useDefault: false,
          overrides: Array.isArray(parsedEvent.reminders) ? parsedEvent.reminders : []
        },
        ...(parsedEvent.recurrence && { recurrence: parsedEvent.recurrence })
      };

      const inserted = await calendar.events.insert({
        calendarId: 'primary',
        resource: newEvent
      });

      responses.push(`✅ Event "${parsedEvent.summary}" has been created.`);
    }

    // Keep session going to allow continuation (e.g. follow-up for next event)
    session.eventCreated = true;

    return res.json({
      response: `${responses.join('\n')}\n\nWhat would you like to add next?`
    });

  } catch (error) {
    console.error("GPT error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});



export default router;
