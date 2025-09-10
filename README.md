```markdown
# 🎤 Speech-to-Text App – Hackathon Quickstart

Real-time voice transcription using **React + Django + WebSockets + Groq API**.

Fast, clean, and ready to demo in 5 minutes.

---

## 🐳 Run with Docker (Recommended)

```bash
# Clone and start
git clone https://github.com/your-repo-url.git
cd your-repo-name

# Build and launch
docker-compose up --build
```

- 🔹 Frontend: [`http://localhost:5173`](http://localhost:5173)
- 🔹 Backend: [`http://localhost:8000`](http://localhost:8000)
- 🔹 WebSocket: `ws://localhost:8000/ws/audio/`

> Auto-reloads on code changes. No extra setup needed.

---

## 🔐 Environment Variables

Create `.env` in the **project root**:

```env
GROQ_API_KEY=your_groq_api_key_here
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
VITE_BACKEND_IP=http://localhost:8000
```

> 🪄 Get your free Groq API key: [https://console.groq.com/keys](https://console.groq.com/keys)

---

## 🧠 Where Speech-to-Text Happens

The transcription logic uses **Groq’s** (gpt-oss-20b).

📍 **File**: `backend/app/stt.py`

- ✅ **Line 61 and 123**: gpt-oss-20b

> ⚡ This is where the magic happens — real-time STT powered by Groq.

---

## 🧰 Manual Setup (Optional)

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## ▶️ How to Use

1. Open: [`http://localhost:5173`](http://localhost:5173)
2. Allow microphone access
3. Click the mic button and speak
4. See live transcription appear instantly
5. Click again to stop and save

---

## 🛠 Features

- 🎙️ Real-time audio streaming via WebSocket
- 🔊 Transcription using Groq’s Whisper-large-v3-turbo
- 📋 Copy or download transcriptions
- 📱 Responsive design (mobile & desktop)
- 💥 Fast feedback — ideal for demos

---

## ❌ Common Issues

| Problem | Fix |
|-------|-----|
| Can't connect to backend | Make sure `docker-compose up` is running |
| Mic not working | Allow permissions in browser (try Chrome) |
| No transcription | Check `GROQ_API_KEY` and internet connection |
| CORS error | Ensure `DJANGO_ALLOWED_HOSTS` includes `localhost` |

---

## 🛑 Stop the App

```bash
docker-compose down
```

---

## 🏆 Hackathon Pro Tips

- 💬 Demo by transcribing a teammate’s speech live
- 🚀 Highlight speed: Groq is **one of the fastest** for Whisper inference
- 🎯 Pitch use cases: accessibility, note-taking, interviews
- 🌐 Works in any modern browser — no install needed

---

🚀 **You're ready. Just speak, transcribe, and win.**
```

---

### ✅ Why This Works:
- **Proper Markdown syntax**: Headers, code blocks, lists, tables — all render perfectly on GitHub
- **No fluff**: Only what you need to run, debug, and impress
- **Clear callout** of where Groq is used (`stt.py` lines 61 & 123)
- **Docker-first**, as requested
- **Hackathon-focused**: fast setup, strong demo impact

Let me know if you want a **version with emojis removed**, **dark mode-friendly**, or **for a specific theme (AI, accessibility, etc.)**!
