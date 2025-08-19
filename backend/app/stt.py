import openai
import io
import os
import base64
from dotenv import load_dotenv
load_dotenv()

def speech_to_text(audio_base64: str) -> str:
    """
    Convert base64-encoded audio into text using OpenAI Whisper API.
    """
    if not audio_base64:
        return None
    
    # Decode base64 to bytes
    audio_bytes = base64.b64decode(audio_base64)

    # Wrap bytes in a file-like object
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.mp3"  # Whisper needs a filename (mp3/wav)

    # Transcribe
    transcript = openai.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file
    )
    
    return transcript.text

def generate_response(user_text: str) -> str:
    """
    Generate a response using OpenAI GPT-3.5 Turbo.
    """
    if not user_text:
        return None
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that can answer questions and help with tasks."},
            {"role": "user", "content": user_text}
        ]
    )

    return response.choices[0].message.content