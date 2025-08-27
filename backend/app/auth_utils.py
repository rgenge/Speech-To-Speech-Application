import jwt
from functools import wraps
from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import User

def jwt_required(f):
    """
    Decorator that requires a valid JWT token to access the endpoint.
    Adds the authenticated user to the request object.
    """
    @wraps(f)
    def decorated(request, *args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return JsonResponse({
                'error': 'Authorization header is required'
            }, status=401)
        
        # Check if header starts with 'Bearer '
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'error': 'Authorization header must start with Bearer'
            }, status=401)
        
        # Extract token
        token = auth_header.split(' ')[1]
        
        try:
            # Validate token using simple-jwt
            UntypedToken(token)
            
            # Decode token to get user information
            decoded_token = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256']
            )
            
            # Get user ID from token
            user_id = decoded_token.get('user_id')
            
            if not user_id:
                return JsonResponse({
                    'error': 'Invalid token payload'
                }, status=401)
            
            # Get user from database
            try:
                user = User.objects.get(id=user_id)
                request.user = user
            except User.DoesNotExist:
                return JsonResponse({
                    'error': 'User not found'
                }, status=401)
            
            return f(request, *args, **kwargs)
            
        except (InvalidToken, TokenError):
            return JsonResponse({
                'error': 'Invalid or expired token'
            }, status=401)
        except jwt.ExpiredSignatureError:
            return JsonResponse({
                'error': 'Token has expired'
            }, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({
                'error': 'Invalid token'
            }, status=401)
        except Exception as e:
            return JsonResponse({
                'error': 'Authentication failed'
            }, status=401)
    
    return decorated

def get_user_from_token(token):
    """
    Extract user from JWT token.
    Returns User object or None if invalid.
    """
    try:
        # Validate token using simple-jwt
        UntypedToken(token)
        
        # Decode token to get user information
        decoded_token = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=['HS256']
        )
        
        # Get user ID from token
        user_id = decoded_token.get('user_id')
        
        if user_id:
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                return None
        
        return None
        
    except (InvalidToken, TokenError, jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
    except Exception:
        return None

def create_conversation_with_user(user, user_text, llm_response):
    """
    Helper function to create a conversation record for an authenticated user.
    """
    from .models import Conversation
    
    if user and user_text and llm_response:
        conversation = Conversation.objects.create(
            user=user,
            user_text=user_text,
            llm_response=llm_response
        )
        return conversation
    return None
