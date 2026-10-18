from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Movie, Artist, Track, MerchItem, Order

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'avatar_url', 'role', 'is_premium', 'subscription_tier', 'subscription_expiry', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined', 'profile']

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = '__all__'

class TrackSerializer(serializers.ModelSerializer):
    artist_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Track
        fields = '__all__'

    def get_artist_details(self, obj):
        if obj.artist:
            return {'id': obj.artist.id, 'name': obj.artist.name, 'avatar_url': obj.artist.avatar_url}
        return None

class ArtistSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True, read_only=True)

    class Meta:
        model = Artist
        fields = '__all__'

class MerchItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
