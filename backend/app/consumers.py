import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import logging
from urllib.parse import parse_qs
from .models import User, Conversation
from .stt import (
    speech_to_text,
    generate_response,
    speech_to_text_google,
    generate_response_groq,
    generate_response_with_history
)
from .auth_utils import get_user_from_token

logger = logging.getLogger(__name__)

class AudioConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None

    async def connect(self):
        """Accept WebSocket connection and authenticate user"""
        try:
            # Get token from query string
            query_string = self.scope['query_string'].decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]

            if token:
                # Authenticate user with token
                self.user = await self.get_user_from_token_async(token)

                if self.user:
                    await self.accept()
                    logger.info(f"WebSocket connection established for user: {self.user.email}")

                    # Send confirmation message
                    await self.send(text_data=json.dumps({
                        'type': 'connection_established',
                        'message': 'WebSocket connected successfully',
                        'user': {
                            'id': self.user.id,
                            'name': self.user.name,
                            'email': self.user.email
                        }
                    }))
                else:
                    # Invalid token
                    await self.close(code=4001)
                    logger.warning("WebSocket connection rejected: Invalid token")
            else:
                # No token provided - reject connection
                await self.close(code=4003)
                logger.warning("WebSocket connection rejected: No token provided")

        except Exception as e:
            logger.error(f"Error during WebSocket connection: {str(e)}")
            await self.close(code=4000)

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
    def get_user_from_token_async(self, token):
        """Async wrapper for token authentication"""
        return get_user_from_token(token)

    @database_sync_to_async
    def convert_audio_to_text(self, audio_data):
        """Convert base64 audio data to text using speech recognition"""
        try:
            # Use the speech_to_text_google function which now handles WebM conversion
            user_text = speech_to_text_google(audio_data)
            print("Speech to Text: ", user_text)

            # Get conversation history for authenticated users
            conversation_history = []
            if self.user:
                # Get recent conversations for context (last 10)
                recent_conversations = Conversation.objects.filter(
                    user=self.user
                ).order_by('-created_at')[:10]

                # Convert to list format for the LLM function
                conversation_history = [{
                    'user_text': conv.user_text,
                    'llm_response': conv.llm_response
                } for conv in reversed(recent_conversations)]

                # Generate response with conversation history context
                llm_response = generate_response_with_history(user_text, conversation_history, self.user)
                print(f"Response with history for user {self.user.email}: ", llm_response)
            else:
                # For anonymous users, use simple response without history
                llm_response = generate_response_groq(user_text)
                print("Response (anonymous): ", llm_response)

            # Save the conversation to the database with authenticated user
            conversation = None
            if self.user:
                conversation = Conversation.objects.create(
                    user=self.user,
                    user_text=user_text,
                    llm_response=llm_response
                )
                print(f"Conversation saved for user {self.user.email}: ", conversation)
            else:
                # No authenticated user - this shouldn't happen with required auth
                print("Warning: No authenticated user for conversation")

            return user_text, llm_response

        except Exception as e:
            logger.error(f"Error in speech to text conversion: {e}")
            return "", ""
