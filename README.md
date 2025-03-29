# 🧸 FuzzyBuddy - Youw AI Cawendaw Compawnion & Study Buddy! (≧◡≦)

Hewwo fwiend! FuzzyBuddy is youw adowabowl pwoductivity paw that wives on youw scween wike a wittwe Tamagotchi — but it does **wayyy mowe than just bouncy bouncy~** 💻💖

It **connects with your Google Calendar**, helps you **manage your daily tasks with natural language**, and ensures you are focused while you study by **making sure you’re not messing with your phone** 👀📱

---

## ✨ Featuwes

### 📅 Talk to Your Calendar Naturally - Cawendaw tawkies
FuzzyBuddy can:
- 🧠 Understand **natural language questions** like:
  - “What do I have to do today?”
  - “What events do I have tomorrow?”
- ✅ **Create new events** directly from chat
- 🔄 **Update or delete existing events** from chat
- ✅ **Complete tasks** and increase your pet’s happiness meter!

Keep your pet happy by staying on top of your schedule! 🐾

---

### 📚 Study Mode — Focus with youw fwuffy buddy! 🐱⏲️

Switch to **STUDY** mode and youw buddy gets sewious about youw focus! >:3

- ⏲ **Editable timer** for deep work or Pomodoro sessions
- 📱 **Phone detection with OpenCV**:
  - FuzzyBuddy watches you through the webcam
  - If you pick up your phone, **it ACTUALLY yells at you with a cute voice (totally not the developer's voice btw)😾**  
    _"HEY! Are you scrolling right now?!"_
---

## 🧠 How It Wowks

- 🐥 **Fwontrend:** React + Tailwind CSS
- 🔧 **Backwend:** Node.js + Expwess
- 🧠 **Smowt AI:** ChatGPT API (GPT be smowt smowt)
- 📅 **Cawendaw Integwation:** Googwe Cawendaw API
- 🕵️ **Phone Snooping:** Python + OpenCV (vawwid use I pwomise!!)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/BobbySuciady/FuzzyBuddy.git
cd showcase-site
```


### 2. Install packages
```bash
npm i
cd server
npm i
pip install opencv-python opencv-python-headless opencv-contrib-python
```

### 3. Create .env in showcase-site/server
```bash
GOOGLE_CLIENT_ID= YOUR GOOGLE CLIENT ID
GOOGLE_CLIENT_SECRET= YOUR GOOGLE CLIENT SECRET
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/redirect
OPENAI_API_KEY= YOUR OPENAI API KEY
```

### 4. Run server
at /showcase-site
```bash
npm run dev
```
and at /showcase-site/server
```bash
node app.js
```
