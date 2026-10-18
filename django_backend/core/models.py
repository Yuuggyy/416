import uuid
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('user', 'Utilisateur / Membre'),
        ('artist', 'Artiste / Créateur'),
        ('admin', 'Administrateur 416'),
    ]

    TIER_CHOICES = [
        ('free', 'Membre Gratuit (Free)'),
        ('premium_monthly', 'Abonnement Mensuel Premium 416'),
        ('vip_416', 'Pass VIP All Access 416'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=30, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    is_premium = models.BooleanField(default=False)
    subscription_tier = models.CharField(max_length=50, choices=TIER_CHOICES, default='free')
    subscription_expiry = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} ({'VIP Premium' if self.is_premium else 'Free'})"

class Movie(models.Model):
    CATEGORY_CHOICES = [
        ('Films', 'Films & Longs-Métrages'),
        ('Documentaires', 'Documentaires Street'),
        ('Clips', 'Clips Officiels'),
        ('Séries', 'Séries & Coulisses'),
        ('Exclusifs', 'Exclusivités 416'),
    ]

    AGE_RATING_CHOICES = [
        ('ALL', 'Tous publics'),
        ('12+', 'Déconseillé aux -12 ans'),
        ('16+', 'Interdit aux -16 ans'),
        ('18+', 'Réservé aux adultes (+18)'),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, blank=True)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    poster_url = models.URLField(max_length=500)
    banner_url = models.URLField(max_length=500)
    video_url = models.URLField(max_length=500)
    trailer_url = models.URLField(max_length=500, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Films', db_index=True)
    duration_minutes = models.IntegerField(default=90)
    release_year = models.IntegerField(default=2026)
    rating = models.FloatField(default=4.8)
    age_rating = models.CharField(max_length=10, choices=AGE_RATING_CHOICES, default='ALL')
    director = models.CharField(max_length=255, default='416 Productions')
    is_featured = models.BooleanField(default=False, db_index=True)
    is_premium_only = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"416 Film: {self.title} ({self.category})"

class Artist(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255, db_index=True)
    real_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=100, default='Rappeur & Producteur')
    bio = models.TextField()
    avatar_url = models.URLField(max_length=500)
    banner_url = models.URLField(max_length=500)
    social_instagram = models.CharField(max_length=100, blank=True)
    social_youtube = models.CharField(max_length=100, blank=True)
    social_spotify = models.CharField(max_length=100, blank=True)
    start_year = models.IntegerField(default=2020)
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"416 Artist: {self.name} ({self.role})"

class Track(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=255, db_index=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='tracks', null=True, blank=True)
    artist_name = models.CharField(max_length=255, default='416 All Stars')
    album = models.CharField(max_length=255, default='Single 416')
    audio_url = models.URLField(max_length=500)
    cover_url = models.URLField(max_length=500)
    duration_seconds = models.IntegerField(default=180)
    plays_count = models.IntegerField(default=0)
    genre = models.CharField(max_length=100, default='Rap FR', db_index=True)
    release_date = models.CharField(max_length=50, default='2026')
    is_premium_only = models.BooleanField(default=False)
    is_explicit = models.BooleanField(default=False)
    lyrics = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Track: {self.title} par {self.artist_name}"

class MerchItem(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    name = models.CharField(max_length=255, db_index=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=10, default='€')
    description = models.TextField()
    image_url = models.URLField(max_length=500)
    category = models.CharField(max_length=100, default='T-Shirts', db_index=True)
    available_sizes = models.JSONField(default=list)
    stock_quantity = models.IntegerField(default=50)
    is_new = models.BooleanField(default=False)
    in_stock = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Merch: {self.name} - {self.price}{self.currency}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'En attente de paiement'),
        ('Confirmed', 'Commande Confirmée'),
        ('Shipped', 'Expédiée / En cours de livraison'),
        ('Delivered', 'Livrée avec succès'),
        ('Cancelled', 'Annulée'),
    ]

    PAYMENT_CHOICES = [
        ('WhatsApp', 'WhatsApp Direct Checkout'),
        ('Card', 'Carte Bancaire / Stripe'),
        ('MobileMoney', 'Mobile Money'),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4)
    order_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=50)
    customer_address = models.TextField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    items_data = models.JSONField(default=list)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_CHOICES, default='WhatsApp')
    payment_status = models.CharField(max_length=20, default='Unpaid') # 'Unpaid', 'Paid', 'Refunded'
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    tracking_number = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Commande #{self.order_number or self.id} ({self.customer_name}) - {self.status}"
