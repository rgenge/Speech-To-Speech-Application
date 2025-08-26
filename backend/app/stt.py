import openai
import io
import os
import base64
import tempfile
from groq import Groq
import speech_recognition as sr
from pydub import AudioSegment
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


def generate_response_groq(user_text: str) -> str:
    """
    Generate a response using OpenAI gpt-oss-20b.
    """
    if not user_text:
        return None
    
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that can answer questions and help with tasks."},
            {"role": "user", "content": user_text}
        ],
        temperature=1,
        max_completion_tokens=8192,
        top_p=1,
        reasoning_effort="medium",
        stream=False,
        stop=None
    )

    return response.choices[0].message.content

def speech_to_text_google(audio_base64: str) -> str:
    """
    Convert base64-encoded audio into text using free Google Web Speech API.
    (Note: Requires internet, but no API key)
    """
    if not audio_base64:
        return None

    # Decode base64 to bytes
    audio_bytes = base64.b64decode(audio_base64)

    # Create temporary files for processing
    temp_input_file = None
    temp_wav_file = None
    
    try:
        # Save the original audio (likely WebM) to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_input:
            temp_input.write(audio_bytes)
            temp_input_file = temp_input.name

        # Convert WebM to WAV using pydub
        audio_segment = AudioSegment.from_file(temp_input_file, format="webm")
        
        # Create temporary WAV file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_wav:
            temp_wav_file = temp_wav.name
        
        # Export as WAV
        audio_segment.export(temp_wav_file, format="wav")

        # Use speech_recognition with the converted WAV file
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_wav_file) as source:
            audio = recognizer.record(source)  # Read entire audio file

        # Use free Google Web Speech API
        text = recognizer.recognize_google(audio)
        return text
        
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError as e:
        return f"Google Speech Recognition error: {e}"
    except Exception as e:
        return f"Audio processing error: {e}"
    finally:
        # Clean up temporary files
        if temp_input_file and os.path.exists(temp_input_file):
            try:
                os.unlink(temp_input_file)
            except:
                pass
        if temp_wav_file and os.path.exists(temp_wav_file):
            try:
                os.unlink(temp_wav_file)
            except:
                pass