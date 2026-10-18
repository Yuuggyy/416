from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_home_view(request):
    return JsonResponse({
        'status': 'online',
        'service': '416 Records Central API Server',
        'version': '1.0.0',
        'endpoints': {
            'admin_panel': '/admin/',
            'api_root': '/api/',
            'auth_token': '/api/token/',
            'movies': '/api/movies/',
            'artists': '/api/artists/',
            'tracks': '/api/tracks/',
            'merch': '/api/merch/',
            'orders': '/api/orders/',
            'upload': '/api/upload/',
        }
    })

urlpatterns = [
    path('', root_home_view, name='root_home'),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
