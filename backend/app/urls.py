from django.urls import path
from .views import (
    RegisterView, 
    LoginView,
    UserConversationsView,
    ClearConversationsView,
    protected_endpoint_example
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('conversations/', UserConversationsView.as_view(), name='user_conversations'),
    path('conversations/clear/', ClearConversationsView.as_view(), name='clear_conversations'),
    path('protected-example/', protected_endpoint_example, name='protected_example'),
]
