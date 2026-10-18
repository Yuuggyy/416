from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import MovieViewSet, ArtistViewSet, TrackViewSet, MerchItemViewSet, OrderViewSet, admin_users_list, toggle_user_premium, user_profile, upload_file

router = DefaultRouter()
router.register(r'movies', MovieViewSet)
router.register(r'artists', ArtistViewSet)
router.register(r'tracks', TrackViewSet)
router.register(r'merch', MerchItemViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('upload/', upload_file, name='upload_file'),
    path('user/profile/', user_profile, name='user_profile'),
    path('admin/users/', admin_users_list, name='admin_users_list'),
    path('admin/users/<int:user_id>/toggle-premium/', toggle_user_premium, name='toggle_user_premium'),
]
