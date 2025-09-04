from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Conversation


class UserAdmin(BaseUserAdmin):
    # Fields shown in the list view
    list_display = ("id", "email", "name", "username", "first_name", "last_name", "created_at", "updated_at", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "is_superuser", "created_at")
    search_fields = ("email", "name", "username")
    ordering = ("-created_at",)

    # Fields available when editing a user
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("name", "username", "first_name", "last_name")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined", "created_at", "updated_at")}),
    )

    # Fields available when creating a user
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "first_name", "last_name", "password1", "password2", "is_active", "is_staff"),
        }),
    )

    readonly_fields = ("created_at", "updated_at", "username")
    
    # Custom actions
    actions = ['activate_users', 'deactivate_users']
    
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} user(s) successfully activated.')
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} user(s) successfully deactivated.')
    deactivate_users.short_description = "Deactivate selected users"


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at", "updated_at", "short_user_text", "short_llm_response")
    list_filter = ("created_at", "updated_at")
    search_fields = ("user__email", "user__name", "user_text", "llm_response")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("user",)
    
    def short_user_text(self, obj):
        if obj.user_text:
            return (obj.user_text[:50] + "...") if len(obj.user_text) > 50 else obj.user_text
        return "-"
    short_user_text.short_description = "User Text"
    
    def short_llm_response(self, obj):
        if obj.llm_response:
            return (obj.llm_response[:50] + "...") if len(obj.llm_response) > 50 else obj.llm_response
        return "-"
    short_llm_response.short_description = "LLM Response"
    
    # Custom actions
    actions = ['delete_conversations']
    
    def delete_conversations(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} conversation(s) successfully deleted.')
    delete_conversations.short_description = "Delete selected conversations"


# Register the User model with custom admin
admin.site.register(User, UserAdmin)

# Customize admin site header and title
admin.site.site_header = "Health Assistant App Admin"
admin.site.site_title = "Health Assistant App Admin"
admin.site.index_title = "Welcome to Health Assistant App Administration"