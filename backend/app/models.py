from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import random


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractUser):
    username = models.CharField(max_length=255, unique=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'app_user'

    def save(self, *args, **kwargs):
        if not self.username:
            # Generate username from name: lowercase, replace spaces with underscores, add random numbers
            base_username = self.name.lower().replace(' ', '_')
            
            # Generate 2-3 random numbers for uniqueness
            random_numbers = random.randint(10, 999)
            username = f"{base_username}_{random_numbers}"
            
            # Check if username already exists and regenerate if needed
            while User.objects.filter(username=username).exclude(pk=self.pk).exists():
                random_numbers = random.randint(10, 999)
                username = f"{base_username}_{random_numbers}"
            
            self.username = username
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class Conversation(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    user_text = models.TextField(null=True, blank=True)
    llm_response = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id} - {self.user.email if self.user else 'Anonymous'}"