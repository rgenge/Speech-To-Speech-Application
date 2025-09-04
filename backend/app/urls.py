from django.urls import path
from .views import (
    RegisterView,
    UpdateSocialNumberView,
    LoginView,
    LogoutView,
    UserConversationsView,
    ClearConversationsView,
    protected_endpoint_example
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
	path('update-social-number/', UpdateSocialNumberView.as_view(), name='update-social-number'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('conversations/', UserConversationsView.as_view(), name='user_conversations'),
    path('conversations/clear/', ClearConversationsView.as_view(), name='clear_conversations'),
    path('protected-example/', protected_endpoint_example, name='protected_example'),
]
