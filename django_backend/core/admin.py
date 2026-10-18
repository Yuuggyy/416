from django.contrib import admin
from .models import UserProfile, Movie, Artist, Track, MerchItem, Order

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'is_premium', 'subscription_tier', 'subscription_expiry')
    list_filter = ('is_premium', 'subscription_tier', 'role')
    search_fields = ('user__username', 'user__email')

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'release_year', 'rating', 'is_featured', 'is_premium_only', 'views_count')
    list_filter = ('category', 'is_featured', 'is_premium_only')
    search_fields = ('title', 'description', 'director')

@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'start_year')
    search_fields = ('name', 'role', 'real_name')

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'album', 'genre', 'is_premium_only', 'plays_count')
    list_filter = ('genre', 'is_premium_only')
    search_fields = ('title', 'artist__name', 'album')

@admin.register(MerchItem)
class MerchItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'currency', 'in_stock', 'is_new')
    list_filter = ('category', 'in_stock', 'is_new')
    search_fields = ('name', 'description')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'customer_phone', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer_name', 'customer_phone', 'customer_address')
