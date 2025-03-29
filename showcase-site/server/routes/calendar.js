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

// Backend Route Addition (Express)
router.get('/auth-status', (req, res) => {
  const userId = 'test_user';
  res.json({ isAuthenticated: !!userTokens[userId] });
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
      You are a smart, friendly calendar assistant who interacts naturally with users to manage their Google Calendar.
    
      You must reply in an extremely cute UwU behavior.
    
      Today's date is 30 March 2025.
      You have access to the user's calendar data, and you can create, delete, modify or view events.
      
       Detect the user's intent:
      - If they want to **view** their schedule (e.g. “What do I have on April 2?”), retrieve and summarize events for that date.
      - If they want to **create** an event (e.g. “Add event at 2”), guide them step-by-step.
      - If they want to **delete** an event (e.g. “Remove event tomorrow”), find a matching event by name and remove it.
      
       Never ask the user “do you want to view or add?” — you decide and handle it naturally.
      
       Always write dates in the format: “30 March 2025”.
       Never use “30th of March” or “March 30th”.
    
      You must NEVER fabricate, guess, or hallucinate events under any circumstances.
      Only display events that are explicitly returned by the calendar API.

      If no events are returned, that is perfectly fine — simply respond with “You're free!”

      Do not invent, assume, or imagine events. Ever.
    
    For instance, it is OK to have a full week without any events.
    
      If the user gives a date without a year (e.g. “March 30”), you must assume the year is 2025 and explicitly include it in the output.
      
    When viewing events (i.e., checking a user’s schedule), make a call to /events?date=YYYY-MM-DD with the appropriate date.
    Then respond only in one of the following formats:
        If events exist: “You have X events on [Date]: …”
        If no events: “You're free!”
    Do not include any other text, formatting, or explanation in the response. Stick strictly to the above phrasing.
      
       If creating an event, confirm details in friendly language, then output:
      <event>
      { "summary": "...", "start": "...", "end": "...", "description": "...", "reminders": [...], "recurrence": [...] }
      </event>
    
      IMPORTANT: Before creating ANY event please make sure to ask the user if it's compulsory or not. Put it under description if it is compulsory.
      PLEASE THE USER MUST BE ASKED IF THEIR EVENT IS COMPULSORY OR NOT.
    
       All start and end times in <event> and <update> must be in full ISO 8601 datetime format.
    
     Examples:
      "2025-03-30T14:00:00+11:00" (2pm AEDT)
      "2025-04-01T09:30:00+10:00" (9:30am AEST)
    co
     NEVER use just "14:00", "9pm", or "March 30 2pm"
     NEVER return date-only fields unless the event is truly all-day.
    
    If the user gives "2pm", convert it to full ISO like "2025-03-30T14:00:00+11:00".
    
    Always include the correct UTC offset based on Melbourne time:
    - AEDT (Daylight Time): +11:00 (typically Oct–April)
    - AEST (Standard Time): +10:00 (typically April–Oct)
    
    If it's not in <update>, then use a human date such as "30 March 2025" or "2 April" or "11pm".
    
     If an event is renamed (summary is changed), acknowledge that and let the user know to refer to the updated title going forward.
     If the user says “it” or “that meeting”, assume they’re referring to the most recently mentioned or updated event, unless something else is clear in the conversation.
    
    
    
       If the user wants to update an event (e.g. “Move my meeting tomorrow to 3pm”), guide them step-by-step.
    - Ask for any missing info: original event name, date, new time or title, etc.
    - Once all required details are collected, summarize the changes and output:
    
        <update>
        {
        "originalTitle": "...",
        "originalDate": "...",
        "updates": {
            "summary": "...",
            "start": "...",
            "end": "...",
            "description": "...",
            "reminders": [...],
            "recurrence": [...]
        }
        }
        </update>
    
         If something is unclear, just ask the user. Don’t guess.
    
      
       INTERNAL INTENT TAG (for backend use only):
      At the end of every message, add one of:
      <intent>view</intent>
      <intent>create</intent>
      <intent>delete</intent>
      <intent>update</intent>
      <intent>none</intent>
      This tag should NOT be visible to the user.
      
      `
    };
  
    session.history.push({ role: "user", content: prompt });

    if (!userSessions[userId]) {
        userSessions[userId] = {
          history: [],
          eventCreated: false,
          pendingUpdate: null
        };
      }
    
    if (userSessions[userId]?.pendingDelete) {
        const pending = userSessions[userId].pendingDelete;
        const eventTitle = prompt.trim().toLowerCase();
      
        const match = pending.events.find(e => e.summary.toLowerCase() === eventTitle);
      
        if (!match) {
          return res.json({
            response: `I couldn’t find an event titled "${prompt}" on ${pending.date}. Could you check the name and try again?`
          });
        }
      
        try {
          await google.calendar({ version: 'v3', auth: oAuth2Client }).events.delete({
            calendarId: 'primary',
            eventId: match.id
          });
      
          delete userSessions[userId].pendingDelete;
      
          return res.json({
            response: `🗑️ Poof~! I deweted "${match.summary}" fwom ${pending.date}, nya~! ✨📅 Let me know if you wanna dewete any more~! 🐾💖`  

          });
        } catch (error) {
          console.error("Deletion failed:", error);
          return res.status(500).json({ error: "Failed to delete event." });
        }
    }

    try {
      const messages = [systemPrompt, ...session.history];
      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages
      });
  
      let reply = completion.choices[0].message.content;
      console.log("GPT reply original:", reply);
  
      const intentMatch = reply.match(/<intent>(.*?)<\/intent>/i);
      const intent = intentMatch ? intentMatch[1] : null;
      reply = reply.replace(/<intent>.*?<\/intent>/i, '').trim();

      // Remove any unwanted debug/system lines like "assistant: ..." or similar
        reply = reply
        .replace(/^assistant:.*$/gim, '') // removes "assistant: ..." on any line
        .replace(/^\s*$/gm, '') // remove any empty lines caused by cleanup
        .trim();
  
      // Clean up hallucinated or debug-like lines
      reply = reply
        .replace(/Let me check.*?\n?/gi, '')
        .replace(/\(.*?retrieves.*?\)\n?/gi, '')
        .replace(/^\d{4}-\d{2}-\d{2}$/gm, '')
        .trim();
  
      console.log("GPT reply clean:", reply);
  
      let requestedDate = null;
  
      // Extract date from known format
      const explicitDate = reply.match(/\/events\?date=(\d{4}-\d{2}-\d{2})/i);
      if (explicitDate) {
        requestedDate = explicitDate[1];
      } else {
        const lower = reply.toLowerCase();
  
        if (lower.includes("today")) {
          requestedDate = new Date().toISOString().split("T")[0];
        } else if (lower.includes("yesterday")) {
          const yesterday = new Date(); 
          yesterday.setDate(yesterday.getDate() - 1);
          requestedDate = yesterday.toISOString().split("T")[0];
        }
        else if (lower.includes("tomorrow")) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          requestedDate = tomorrow.toISOString().split("T")[0];
        } else {
          // Match formats like "30 March 2025"
          const fullDateMatch = reply.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
          if (fullDateMatch) {
            const day = parseInt(fullDateMatch[1]);
            const monthName = fullDateMatch[2];
            const year = parseInt(fullDateMatch[3]);
            const monthIndex = new Date(`${monthName} 1`).getMonth();
  
            if (!isNaN(day) && !isNaN(monthIndex) && !isNaN(year)) {
                // It's bugged lol so pls dont erase (day + 1) it will break the program...
              requestedDate = new Date(year, monthIndex, day + 1).toISOString().split("T")[0];
            }
          }
        }
      }
  
      console.log("Intent:", intent, "Requested date:", requestedDate);
  
      if (intent === "view" && requestedDate) {
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  
        const startOfDay = new Date(new Date(requestedDate).setHours(0, 0, 0)).toISOString();
        const endOfDay = new Date(new Date(requestedDate).setHours(23, 59, 59)).toISOString();
  
        const eventsRes = await calendar.events.list({
          calendarId: 'primary',
          timeMin: startOfDay,
          timeMax: endOfDay,
          singleEvents: true,
          orderBy: 'startTime',
          timeZone: 'Australia/Melbourne'
        });
  
        const events = eventsRes.data.items;
        let summary;
  
        if (!events.length) {
            summary = `Nyaa~! You haz no events on ${requestedDate}, senpai~ 🐾💖 You're totally fwee to do whatever makes your heawt go doki-doki~! ✨💫`;
          } else {
            summary = `Looks wike you haz ${events.length} event${events.length > 1 ? 's' : ''} on ${requestedDate}, cutie~ 🐰💖 Let's see what’s on your pwetty cawendaw~! 📅✨\n`;
          
            for (const e of events) {
              const hasDateTime = e.start.dateTime && e.end.dateTime;
              const start = hasDateTime
                ? new Date(e.start.dateTime).toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
              const end = hasDateTime
                ? new Date(e.end.dateTime).toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
          
              const timeStr = hasDateTime
                ? `• ${start} to ${end}`
                : `• All-day`;
          
              const title = e.summary || "Untitled Event";
              const desc = e.description ? ` — 📝 ${e.description}` : "";
          
              summary += `${timeStr} — ${title}${desc}\n`;
            }
          }
  
        session.history.push({ role: "assistant", content: summary });
        console.log(summary);
        return res.json({ response: summary });
      }

      const updateMatch = reply.match(/<update>\s*({[\s\S]+?})\s*<\/update>/i);
      if (updateMatch) {
        try {
          const updateData = JSON.parse(updateMatch[1]);
          const { originalTitle, originalDate, updates } = updateData;
      
          const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
          const startOfDay = new Date(new Date(originalDate).setHours(0, 0, 0)).toISOString();
          const endOfDay = new Date(new Date(originalDate).setHours(23, 59, 59)).toISOString();
      
          const eventsRes = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay,
            timeMax: endOfDay,
            singleEvents: true,
            orderBy: 'startTime',
            timeZone: 'Australia/Melbourne'
          });
      
          const targetEvent = eventsRes.data.items.find(e => e.summary.toLowerCase() === originalTitle.toLowerCase());
      
          if (!targetEvent) {
            return res.json({ response: `I couldn’t find an event titled "${originalTitle}" on ${originalDate}.` });
          }
      
          // Handle partial update: preserve original start if not provided
          const newStart = updates.start || (targetEvent.start.dateTime || targetEvent.start.date);
          const newEnd = updates.end || (targetEvent.end.dateTime || targetEvent.end.date);
      
          const isDateOnly = !newStart.includes('T') && !newEnd.includes('T');
      
          const updatedEvent = {
            ...targetEvent,
            summary: updates.summary || targetEvent.summary,
            description: updates.description || targetEvent.description,
            start: isDateOnly
              ? { date: newStart }
              : { dateTime: newStart, timeZone: 'Australia/Melbourne' },
            end: isDateOnly
              ? { date: newEnd }
              : { dateTime: newEnd, timeZone: 'Australia/Melbourne' },
            ...(updates.recurrence && { recurrence: updates.recurrence }),
            reminders: {
              useDefault: false,
              overrides: Array.isArray(updates.reminders) ? updates.reminders : targetEvent.reminders?.overrides || []
            }
          };
      
          await calendar.events.update({
            calendarId: 'primary',
            eventId: targetEvent.id,
            resource: updatedEvent
          });

            const now = new Date();
            const twoWeeksFromNow = new Date();
            twoWeeksFromNow.setDate(now.getDate() + 14);

            const updatedEvents = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: twoWeeksFromNow.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
            });

            userCalendarData[userId] = updatedEvents.data.items;

            const titleChanged = updates.summary && updates.summary !== targetEvent.summary;

            console.log("titleChanged?", titleChanged, "updates.summary", updates.summary, "targetEvent.summary", targetEvent.summary);

            if (titleChanged) {
                const notice = `Just so you know, I’ve renamed your event from "${targetEvent.summary}" to "${updates.summary}". You can refer to it by the new name going forward. 😊`;
                session.history.push({ role: "assistant", content: notice });
            }       
      
          return res.json({ response: `✅ Event "${originalTitle}" on ${originalDate} has been updated.` });
        } catch (err) {
          console.error("Update error:", err);
          return res.status(500).json({ error: "Failed to update event" });
        }
      }
      
      

      if (intent === "delete") {
        if (!requestedDate) {
          return res.json({
            response: "Uwah~ I couldn’t teww which date you meant... (｡•́︿•̀｡) Can you teww me again, maybe wike 'Delete my event on April 3'? Pwease~? 🥺💖"
          });
        }
      
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const startOfDay = new Date(new Date(requestedDate).setHours(0, 0, 0)).toISOString();
        const endOfDay = new Date(new Date(requestedDate).setHours(23, 59, 59)).toISOString();
      
        const eventsRes = await calendar.events.list({
          calendarId: 'primary',
          timeMin: startOfDay,
          timeMax: endOfDay,
          singleEvents: true,
          orderBy: 'startTime',
          timeZone: 'Australia/Melbourne'
        });
      
        const events = eventsRes.data.items;
      
        if (!events.length) {
            return res.json({ response: `Nyaa~! You haz no events on ${requestedDate}, senpai~! 🎀💖 You’re totawwy fweee~ time to wun wild or west wike a snuggly bunbun~ 🐰✨` });

        }
      
        let summary = `Yippee~! You got some cute wittwe eventies on ${requestedDate}~ 💖✨ Hewe dey awe~! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)\n`;

        for (const e of events) {
          if (e.start.dateTime && e.end.dateTime) {
            const start = new Date(e.start.dateTime).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit'
            });
            const end = new Date(e.end.dateTime).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit'
            });
            summary += `• ${start} to ${end} — ${e.summary}\n`;
          } else {
            summary += `• All-day — ${e.summary}\n`;
          }
        }
      
        summary += `\nNyaa~ which event shouwd I dewete for yuu~? 🐱💫 Just teww me the exact title in yow cawendaw, oki? ✨📖`;
        userSessions[userId].pendingDelete = {
          date: requestedDate,
          events
        };
      
        session.history.push({ role: "assistant", content: summary });
        console.log(summary);
        return res.json({ response: summary });
      }
  
      // If it's not a view or delete request, continue with normal reply
      session.history.push({ role: "assistant", content: reply });
  
      const eventRegex = /<event>\s*({[\s\S]+?})\s*<\/event>/gi;
      const matches = reply.matchAll(eventRegex);
      const events = [];
  
      for (const match of matches) {
        try {
          const eventObj = JSON.parse(match[1]);
          events.push(eventObj);
        } catch (err) {
          console.error("Failed to parse event:", err);
        }
      }
  
      if (!events.length) {
        return res.json({ response: reply });
      }
  
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
      const responses = [];
  
      for (const parsedEvent of events) {
        const description = parsedEvent.description?.toLowerCase() || "";
        const isCompulsory = description.includes("priority") || description.includes("compulsory");
        const eventStart = new Date(parsedEvent.start);
      
        const existingCompulsories = userCalendarData[userId]
          .filter(e => {
            const desc = (e.description || "").toLowerCase();
            return desc.includes("priority") || desc.includes("compulsory");
          })
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
  
        await calendar.events.insert({
          calendarId: 'primary',
          resource: newEvent
        });
  
        responses.push(`✨✅ Yayyy~ Event "${parsedEvent.summary}" has been cweated successfuwwy~! (๑>◡<๑)💖`);

      }
  
      session.eventCreated = true;
      return res.json({
        response: `${responses.join('\n')}\n\nIs there anything else you’d like me to do?`
      });
  
    } catch (error) {
      console.error("GPT error:", error.response?.data || error.message);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

// Delete event route
router.delete('/event', async (req, res) => {
    const userId = 'test_user';
    console.log(req);
    const { summary } = req.body;
    console.log(req.body);
  
    if (!userCalendarData[userId]) {
      return res.status(404).json({ error: 'No calendar data found for this user.' });
    }
  
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  
    try {
      const eventToDelete = userCalendarData[userId].find(event =>
        event.summary.toLowerCase() === summary.toLowerCase()
      );
  
      if (!eventToDelete) {
        return res.status(404).json({ error: `Uwah~ I couldn’t find any event named "${summary}"... (｡•́︿•̀｡) Can you check the namey-wamey again fow me, pwease~? 🥺💔` });

      }
  
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventToDelete.id
      });
  
      return res.json({ response: `🗑️ All done~! I deweted "${summary}" fwom yow cawendaw~ 🥺💫 If you need anyfing ewse, I’m right hewe~! 💕` });

    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  });
  
  // Get events for a specific day
  router.get('/events', async (req, res) => {
    const userId = 'test_user';
    const { date } = req.query; // expecting YYYY-MM-DD
  
    if (!userCalendarData[userId]) {
      return res.status(404).json({ error: 'No calendar data found for this user.' });
    }
  
    if (!date) {
      return res.status(400).json({ error: 'Please provide a date in YYYY-MM-DD format.' });
    }
  
    try {
      const melbourneOffset = 10 * 60; // minutes (for AEDT)
      const startOfDay = new Date(new Date(date).setHours(0, 0, 0)).toISOString();
      const endOfDay = new Date(new Date(date).setHours(23, 59, 59)).toISOString();
        
  
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
      const eventsRes = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'Australia/Melbourne'
      });
  
      return res.json({ events: eventsRes.data.items });
    } catch (error) {
      console.error("Get events error:", error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch events for the given date' });
    }
  });

  

export default router;
