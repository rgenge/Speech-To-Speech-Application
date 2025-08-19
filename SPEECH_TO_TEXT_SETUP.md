# 🎤 Speech-to-Text WebSocket Application Setup Guide

This guide will help you set up and run the complete speech-to-text application with WebSocket communication between React frontend and Django backend.

## 🏗️ Architecture Overview

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   React App     │ ◄────────────► │  Django Backend │
│                 │                 │                 │
│ • Microphone    │    ws://        │ • WebSocket     │
│ • Audio Recording│   localhost:8000│   Consumer      │
│ • Transcription │   /ws/audio/    │ • Speech-to-Text│
│   Display       │                 │   Processing    │
└─────────────────┘                 └─────────────────┘
```

## 📋 Prerequisites

1. **Python 3.8+** (preferably 3.11+)
2. **Node.js 16+** and npm
3. **Modern web browser** with microphone access
4. **Internet connection** (for Google Speech Recognition API)

## 🚀 Quick Setup

### 1. Backend Setup (Django + WebSockets)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (if not already done)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Start the Django development server
python manage.py runserver
```

The backend will be available at: `http://localhost:8000`
WebSocket endpoint: `ws://localhost:8000/ws/audio/`

### 2. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 🎯 How to Use

1. **Open the application** in your web browser at `http://localhost:5173`

2. **Grant microphone permissions** when prompted by the browser

3. **Check connection status** - You should see "Connected" in the status bar

4. **Start recording**:
   - Click the microphone button
   - The button will turn red and show "Recording..."
   - Start speaking clearly

5. **Stop recording**:
   - Click the button again to stop recording
   - Your speech will be converted to text and displayed

6. **View transcriptions**:
   - All transcriptions appear in the transcription display
   - Each entry shows timestamp and text
   - You can copy individual transcriptions or download all as a text file

## 🔧 Features

### Frontend Features
- **🎤 Audio Recording**: High-quality audio capture using MediaRecorder API
- **🔌 WebSocket Connection**: Real-time communication with backend
- **📝 Live Transcription**: Immediate display of converted text
- **📋 Copy & Download**: Copy individual texts or download complete transcription
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🎨 Modern UI**: Beautiful gradient design with animations

### Backend Features
- **🔌 WebSocket Support**: Real-time audio data processing
- **🗣️ Speech Recognition**: Google Speech Recognition integration
- **🎵 Audio Processing**: Supports WebM audio format conversion
- **🔄 Error Handling**: Comprehensive error management
- **📊 Logging**: Detailed logging for debugging

## 🛠️ Technical Details

### Audio Processing Flow

1. **Frontend captures audio** using `MediaRecorder` API
2. **Audio is encoded** as WebM format
3. **Data is sent** via WebSocket as base64
4. **Backend converts** WebM to WAV format
5. **Speech recognition** processes the audio
6. **Text is returned** to frontend via WebSocket

### WebSocket Message Types

#### Frontend → Backend
```json
{
  "type": "start_recording",
  "timestamp": 1234567890
}

{
  "type": "audio_data",
  "audio_data": "base64_encoded_audio",
  "timestamp": 1234567890
}

{
  "type": "stop_recording",
  "timestamp": 1234567890
}
```

#### Backend → Frontend
```json
{
  "type": "connection_established",
  "message": "WebSocket connected successfully"
}

{
  "type": "transcription",
  "text": "Your transcribed speech",
  "timestamp": 1234567890
}

{
  "type": "error",
  "message": "Error description"
}
```

## 🔍 Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
- Ensure Django server is running on port 8000
- Check CORS settings in Django settings
- Verify firewall/antivirus isn't blocking connections

**2. Microphone Access Denied**
- Grant microphone permissions in browser
- Try refreshing the page
- Check browser settings for microphone access

**3. No Speech Recognition**
- Ensure internet connection (Google API required)
- Check audio quality and speak clearly
- Verify audio format support

**4. Import Errors in Backend**
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version compatibility
- Activate virtual environment

### Browser Compatibility

| Browser | Audio Recording | WebSocket | Status |
|---------|----------------|-----------|--------|
| Chrome 58+ | ✅ | ✅ | Fully Supported |
| Firefox 55+ | ✅ | ✅ | Fully Supported |
| Safari 11+ | ✅ | ✅ | Fully Supported |
| Edge 79+ | ✅ | ✅ | Fully Supported |

## 📦 Dependencies

### Backend Dependencies
- `django==5.2.5` - Web framework
- `channels==4.0.0` - WebSocket support
- `speechrecognition==3.13.1` - Speech-to-text conversion
- `pydub==0.25.1` - Audio processing
- `django-cors-headers==4.4.0` - CORS handling

### Frontend Dependencies
- `react==^19.1.1` - UI framework
- `typescript` - Type safety
- `vite` - Build tool and dev server

## 🚦 Development Commands

### Backend Commands
```bash
# Run development server
python manage.py runserver

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test
```

### Frontend Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## 🔒 Security Considerations

1. **HTTPS in Production**: Use HTTPS for production deployments
2. **WebSocket Security**: Implement authentication for WebSocket connections
3. **Rate Limiting**: Add rate limiting for audio processing
4. **Data Privacy**: Consider local speech recognition for sensitive data

## 📈 Performance Tips

1. **Audio Quality**: Use appropriate bitrate for balance between quality and size
2. **Chunk Size**: Optimize audio chunk sizes for real-time processing
3. **Connection Pooling**: Use connection pooling in production
4. **Caching**: Implement caching for frequently used resources

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**Need help?** Check the troubleshooting section or create an issue in the repository.
