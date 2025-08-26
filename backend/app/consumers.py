import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import logging
from .stt import (
    speech_to_text, 
    generate_response,
    speech_to_text_google,
    generate_response_groq
)

logger = logging.getLogger(__name__)

class AudioConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Accept WebSocket connection"""
        await self.accept()
        logger.info("WebSocket connection established")
        
        # Send confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'WebSocket connected successfully'
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"WebSocket disconnected with code: {close_code}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'audio_data':
                await self.handle_audio_data(data)
            elif message_type == 'start_recording':
                await self.handle_start_recording()
            elif message_type == 'stop_recording':
                await self.handle_stop_recording()
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Server error: {str(e)}'
            }))

    async def handle_start_recording(self):
        """Handle start recording signal"""
        await self.send(text_data=json.dumps({
            'type': 'recording_started',
            'message': 'Recording started successfully'
        }))

    async def handle_stop_recording(self):
        """Handle stop recording signal"""
        await self.send(text_data=json.dumps({
            'type': 'recording_stopped',
            'message': 'Recording stopped successfully'
        }))

    async def handle_audio_data(self, data):
        """Process audio data and convert to text"""
        try:
            audio_data = data.get('audio_data')
            if not audio_data:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'No audio data provided'
                }))
                return

            # Convert audio to text
            user_text, llm_response = await self.convert_audio_to_text(audio_data)
            
            if user_text:
                await self.send(text_data=json.dumps({
                    'type': 'transcription',
                    'text': user_text,
                    'llm_response': llm_response,
                    'timestamp': data.get('timestamp')
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'transcription',
                    'text': '',
                    'llm_response': '',
                    'message': 'No speech detected in audio'
                }))
                
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing audio: {str(e)}'
            }))

    @database_sync_to_async
    def convert_audio_to_text(self, audio_data):
        """Convert base64 audio data to text using speech recognition"""
        try:
            # Use the speech_to_text_google function which now handles WebM conversion
            user_text = speech_to_text_google(audio_data)
            print("Speech to Text: ", user_text)

            # Generate response using gpt-oss-20b
            llm_response = generate_response_groq(user_text)
            print("Response: ", llm_response)
                
            return user_text, llm_response
                
        except Exception as e:
            logger.error(f"Error in speech to text conversion: {e}")
            return "", ""
