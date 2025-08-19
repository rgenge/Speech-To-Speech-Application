# WebSocket API Testing Guide with Postman

## Overview
This guide shows how to test the WebSocket API that handles both text and audio data using Postman.

## WebSocket Endpoint
```
ws://localhost:8000/ws/chat/
```

## Prerequisites
1. Start your Django server with WebSocket support:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Make sure you have Django Channels and daphne installed:
   ```bash
   pip install channels daphne
   ```

## Testing with Postman

### 1. Creating a WebSocket Connection

1. Open Postman
2. Click "New" → "WebSocket Request"
3. Enter the URL: `ws://localhost:8000/ws/chat/`
4. Click "Connect"
5. You should see a connection message:
   ```json
   {
     "type": "system",
     "message": "WebSocket connected. Send JSON with 'type': 'text' or 'audio', or send binary audio data directly."
   }
   ```

### 2. Testing Text Messages

Send a JSON message:
```json
{
  "type": "text",
  "text": "Hello, how are you?"
}
```

Expected response:
```json
{
  "type": "llm_response",
  "input": "Hello, how are you?",
  "reply": "Echo: Hello, how are you?"
}
```

### 3. Testing Ping/Pong

Send a ping message:
```json
{
  "type": "ping",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

Expected response:
```json
{
  "type": "pong",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 4. Testing Audio with Base64

#### Option A: Base64 Encoded Audio in JSON

1. First, convert your audio file to base64. You can use online tools or command line:
   ```bash
   # On macOS/Linux
   base64 -i your_audio.wav
   
   # On Windows
   certutil -encode your_audio.wav audio_base64.txt
   ```

2. Send the JSON message:
   ```json
   {
     "type": "audio",
     "audio_b64": "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhY..."
   }
   ```

Expected response:
```json
{
  "type": "pipeline_result",
  "stt_text": "Transcribed (demo)",
  "llm_text": "Echo: Transcribed (demo)",
  "tts_audio_b64": null,
  "source": "base64_audio"
}
```

#### Option B: Binary Audio Data (Recommended)

1. In Postman WebSocket:
   - Switch message type from "Text" to "Binary"
   - Upload your audio file directly
   - Send the binary data

Expected response:
```json
{
  "type": "pipeline_result",
  "stt_text": "Transcribed (demo)",
  "llm_text": "Echo: Transcribed (demo)",
  "tts_audio_b64": null,
  "source": "binary_audio"
}
```

## Supported Audio Formats

The WebSocket accepts audio in various formats. For best results:
- **WAV files**: 16kHz, 16-bit, mono
- **MP3 files**: Any standard format
- **Raw audio data**: PCM format

## Error Handling

The API provides detailed error messages:

```json
{
  "type": "error",
  "error": "Missing 'text' field"
}
```

Common errors:
- `"Invalid JSON format"` - Malformed JSON in text message
- `"Missing 'text' field"` - Text message without text field
- `"Missing 'audio_b64' field"` - Audio message without base64 data
- `"Invalid base64 encoding"` - Corrupted base64 data
- `"Unknown message type"` - Invalid message type

## Testing Script Example

You can also test using a simple Python script:

```python
import asyncio
import websockets
import json
import base64

async def test_websocket():
    uri = "ws://localhost:8000/ws/chat/"
    
    async with websockets.connect(uri) as websocket:
        # Test text message
        message = {
            "type": "text",
            "text": "Hello WebSocket!"
        }
        await websocket.send(json.dumps(message))
        response = await websocket.recv()
        print("Text response:", response)
        
        # Test binary audio (if you have an audio file)
        try:
            with open("test_audio.wav", "rb") as f:
                audio_data = f.read()
            await websocket.send(audio_data)
            response = await websocket.recv()
            print("Binary audio response:", response)
        except FileNotFoundError:
            print("No test audio file found, skipping binary test")

# Run the test
asyncio.run(test_websocket())
```

## Troubleshooting

### Connection Issues
- Ensure Django server is running with `python manage.py runserver`
- Check that Django Channels is properly configured
- Verify the WebSocket URL is correct

### Message Issues
- Ensure JSON is properly formatted
- Check that required fields are present
- For binary data, ensure the file is not corrupted

### Audio Processing Issues
- The current implementation uses placeholder functions
- Replace `speech_to_text()` and `text_to_speech()` in `views.py` with your actual implementations
- Ensure audio format is supported by your STT service

## Next Steps

1. **Implement Real STT/TTS**: Replace the placeholder functions in `views.py` with actual speech-to-text and text-to-speech implementations
2. **Add Authentication**: Implement user authentication for the WebSocket connection
3. **Add Rate Limiting**: Prevent abuse by implementing rate limiting
4. **Error Logging**: Add comprehensive logging for debugging
5. **File Upload**: Add support for larger audio files through chunked upload

## API Reference

### Message Types

| Type | Purpose | Required Fields | Optional Fields |
|------|---------|----------------|-----------------|
| `text` | Send text for LLM processing | `text` | - |
| `audio` | Send base64 audio for STT+LLM+TTS | `audio_b64` | - |
| `ping` | Test connection | - | `timestamp` |

### Response Types

| Type | Purpose | Fields |
|------|---------|--------|
| `system` | Connection status | `message` |
| `llm_response` | Text processing result | `input`, `reply` |
| `pipeline_result` | Audio processing result | `stt_text`, `llm_text`, `tts_audio_b64`, `source` |
| `pong` | Ping response | `timestamp` |
| `error` | Error message | `error` |
