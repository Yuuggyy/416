import os
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import UserProfile, Movie, Artist, Track, MerchItem, Order
from .serializers import MovieSerializer, ArtistSerializer, TrackSerializer, MerchItemSerializer, OrderSerializer, UserSerializer

class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all().order_by('-created_at')
    serializer_class = MovieSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'category', 'description', 'director']

class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all().order_by('-created_at')
    serializer_class = ArtistSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'real_name', 'role']

class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.all().order_by('-created_at')
    serializer_class = TrackSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'artist_name', 'album', 'genre']

class MerchItemViewSet(viewsets.ModelViewSet):
    queryset = MerchItem.objects.all().order_by('-created_at')
    serializer_class = MerchItemSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'category', 'description']

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def upload_file(request):
    if 'file' not in request.FILES:
        return Response({'error': 'Aucun fichier fourni'}, status=400)

    file_obj = request.FILES['file']
    file_path = default_storage.save(f'uploads/{file_obj.name}', ContentFile(file_obj.read()))
    full_url = request.build_absolute_uri(settings.MEDIA_URL + file_path)
    return Response({'url': full_url, 'path': file_path}, status=201)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def admin_users_list(request):
    users = User.objects.all().order_by('-date_joined')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def toggle_user_premium(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.is_premium = not profile.is_premium
        profile.subscription_tier = 'vip_416' if profile.is_premium else 'free'
        profile.save()
        return Response({
            'success': True,
            'is_premium': profile.is_premium,
            'subscription_tier': profile.subscription_tier
        })
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable'}, status=404)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
