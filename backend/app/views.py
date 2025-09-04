from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError
from .models import User, Conversation
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from .auth_utils import jwt_required
import json
import re

import re
from django.core.exceptions import ValidationError

def validate_profile(value):
    # Ensure it's a string
    if not isinstance(value, str):
        raise ValidationError("Social number must be a string.")

    if not value:
        raise ValidationError("Social number is required.")

    return value


class UpdateSocialNumberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            profile = request.data.get('profile')

            # Validate input
            if not profile:
                return Response({
                    'error': 'Social number is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Clean and validate format
            try:
                cleaned_profile = validate_profile(profile)
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

            # Format for storage: XXX-XX-XXXX

            user = request.user

            # Check if another user already has this profile
            if User.objects.filter(profile=cleaned_profile).exclude(id=user.id).exists():
                return Response({
                    'error': 'This profile is already associated with another account'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update the user's profile
            user.profile = cleaned_profile
            user.save(update_fields=['profile', 'updated_at'])

            return Response({
                'message': 'Profile updated successfully',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'profile': user.profile,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'An error occurred while updating social number'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            name = request.data.get('name')
            email = request.data.get('email')
            password = request.data.get('password')

            # Validate required fields
            if not all([name, email, password]):
                return Response({
                    'error': 'Name, email, and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response({
                    'error': 'User with this email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create user with hashed password
            user = User(name=name, email=email)
            user.set_password(password)
            user.save()

            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'An error occurred during registration'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            # Validate required fields
            if not all([email, password]):
                return Response({
                    'error': 'Email and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Find user by email
            user = User.objects.filter(email=email).first()

            # Check if user exists and password is correct
            if user and user.check_password(password):
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)

                return Response({
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'name': user.name,
                        'email': user.email,
                        'profile': user.profile,
                    },
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            return Response({
                'error': 'An error occurred during login'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Logout failed'
            }, status=status.HTTP_400_BAD_REQUEST)

class UserConversationsView(APIView):
    """Get user conversations - requires authentication"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get user from JWT token (automatically handled by DRF JWT authentication)
            user = request.user

            if not user or not user.is_authenticated:
                return Response({
                    'error': 'User not authenticated'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Get user's conversations
            conversations = Conversation.objects.filter(user=user).order_by('-created_at')

            conversation_data = [{
                'id': conv.id,
                'user_text': conv.user_text,
                'llm_response': conv.llm_response,
                'created_at': conv.created_at.isoformat(),
            } for conv in conversations]

            return Response({
                'conversations': conversation_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'An error occurred while fetching conversations'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ClearConversationsView(APIView):
    """Clear user conversations - requires authentication"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            # Get user from JWT token
            user = request.user

            if not user or not user.is_authenticated:
                return Response({
                    'error': 'User not authenticated'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Delete user's conversations
            deleted_count = Conversation.objects.filter(user=user).delete()[0]

            return Response({
                'message': f'Successfully cleared {deleted_count} conversations'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'An error occurred while clearing conversations'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Example of using the custom JWT decorator for non-DRF views
@csrf_exempt
@require_http_methods(["GET"])
@jwt_required
def protected_endpoint_example(request):
    """
    Example protected endpoint using custom JWT decorator.
    This shows how to use the decorator for function-based views.
    """
    try:
        # request.user is automatically populated by the decorator
        user = request.user

        # Get user's conversation count
        conversation_count = Conversation.objects.filter(user=user).count()

        return JsonResponse({
            'message': f'Hello {user.name}!',
            'user_id': user.id,
            'email': user.email,
            'conversation_count': conversation_count,
            'authenticated': True
        })

    except Exception as e:
        return JsonResponse({
            'error': 'An error occurred'
        }, status=500)
