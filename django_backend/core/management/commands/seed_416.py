# -*- coding: utf-8 -*-
"""Ensemence la base 416 avec le contenu réel du label (films, artistes, titres, merch)
et crée le super-admin depuis les variables d'environ si défini."""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Movie, Artist, Track, MerchItem, UserProfile

FILMS = [
    dict(id='m1', title="416: L'Empire du Son", subtitle="Un film documentaire original 416 Records",
         description="Plongez au cœur de la maison de production 416 Records. Entre création de beats légendaires, sessions studio nocturnes et réalités de la rue, découvrez comment une vision indépendante est devenue un empire musical incontournable.",
         poster_url='https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800',
         banner_url='https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600',
         video_url='https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-cheering-under-lights-42540-large.mp4',
         trailer_url='https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-cheering-under-lights-42540-large.mp4',
         category='Documentaires', duration_minutes=112, release_year=2026, rating=4.9, age_rating='16+',
         director='Yuuggyy', is_featured=True, is_premium_only=False, views_count=185400),
    dict(id='m2', title='QUATRO: La Cité Obscure', subtitle="Film d'action & Thriller Urbain",
         description="Dans les quartiers sombres de la capitale, un groupe de jeunes producteurs pris au piège d'un réseau d'influence doit faire un choix décisif entre la loyauté et la musique.",
         poster_url='https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800',
         banner_url='https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600',
         video_url='https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-in-a-club-41334-large.mp4',
         trailer_url='https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-in-a-club-41334-large.mp4',
         category='Films', duration_minutes=128, release_year=2025, rating=4.8, age_rating='16+',
         director='Sadek & Yuuggyy', is_featured=False, is_premium_only=True, views_count=94300),
    dict(id='m3', title='416 ALL STARS: Le Concert', subtitle='Live Explosif au Zénith',
         description="Le concert événement réunissant tous les artistes emblématiques du label 416 Records devant 15 000 spectateurs en délire.",
         poster_url='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800',
         banner_url='https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600',
         video_url='https://assets.mixkit.co/videos/preview/mixkit-singer-performing-on-stage-with-lights-42543-large.mp4',
         trailer_url='https://assets.mixkit.co/videos/preview/mixkit-singer-performing-on-stage-with-lights-42543-large.mp4',
         category='Clips', duration_minutes=95, release_year=2026, rating=5.0, age_rating='ALL',
         director='416 Crew', is_featured=False, is_premium_only=False, views_count=240000),
    dict(id='m4', title='Nuit Blanche au Studio 416', subtitle='Saison 1 - Dans les coulisses',
         description="Série exclusive en 6 épisodes suivant le processus de création de l'album phare de l'année. Entre clashs artistiques et beats d'exception.",
         poster_url='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
         banner_url='https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600',
         video_url='https://assets.mixkit.co/videos/preview/mixkit-recording-music-studio-session-42283-large.mp4',
         trailer_url='https://assets.mixkit.co/videos/preview/mixkit-recording-music-studio-session-42283-large.mp4',
         category='Séries', duration_minutes=45, release_year=2026, rating=4.7, age_rating='12+',
         director='Yuuggyy', is_featured=False, is_premium_only=False, views_count=78900),
]

ARTISTES = [
    dict(id='a1', name='Yuuggyy', real_name='Y. G.', role='Fondateur & Réalisateur',
         bio='Fondateur de la maison de production 416 Records, réalisateur visionnaire et architecte du son urbain moderne.',
         avatar_url='https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
         banner_url='https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200',
         social_instagram='@yuuggyy_416', social_youtube='Yuuggyy416', social_spotify='Yuuggyy', start_year=2019),
    dict(id='a2', name='Sadek 416', real_name='Sadek', role='Rappeur & Producteur',
         bio="L'une des figures majeures du rap français, lyriciste puissant apportant son identité authentique au collectif 416.",
         avatar_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
         banner_url='https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200',
         social_instagram='@sadek_416', social_youtube='SadekOfficial', social_spotify='Sadek', start_year=2018),
    dict(id='a3', name='416 Beats Lab', real_name='Collectif Beatmakers', role='Beatmaker & Composer',
         bio='Le laboratoire sonore de 416 Records. Des sonorités trap, drill et afro-futures qui façonnent les hits de demain.',
         avatar_url='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400',
         banner_url='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200',
         social_instagram='@416_beats', start_year=2021),
]

TITRES = [
    dict(id='t1', title='416 Anthem (41R)', artist_id='a1', artist_name='Yuuggyy ft. Sadek', album='416 Records Vol. 1',
         audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
         cover_url='https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600',
         duration_seconds=215, plays_count=142000, release_date='2026', genre='Trap / Rap FR', is_explicit=True,
         lyrics="Bienvenue dans le 416...\nOn impose le rythme, pas de concession.\nDu studio à la rue, l'empire du son est en marche.\n\n[Refrain]\n41R Records, la frappe du son urbain\nTous les jours en studio, on prépare le lendemain !"),
    dict(id='t2', title='Ombres et Lumières', artist_id='a1', artist_name='Yuuggyy', album='Quatro Soundtracks',
         audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
         cover_url='https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600',
         duration_seconds=198, plays_count=98500, release_date='2026', genre='Cinematic Rap',
         lyrics='Entre les lumières de la ville et les ombres du studio...\nChaque note raconte une histoire vraie.'),
    dict(id='t3', title='Quatro Freestyle', artist_id='a2', artist_name='Sadek 416', album='Single 416',
         audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
         cover_url='https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600',
         duration_seconds=165, plays_count=210000, release_date='2025', genre='Hardcore Rap', is_premium_only=True, is_explicit=True,
         lyrics="Freestyle Quatro direct du 416 !\nPas de temps à perdre, on envoie le lourd !"),
    dict(id='t4', title='Règne Urbain', artist_id='a2', artist_name='Sadek 416', album='416 Records Vol. 1',
         audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
         cover_url='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600',
         duration_seconds=240, plays_count=187000, release_date='2026', genre='Trap Drill', is_explicit=True,
         lyrics='Le règne urbain commence maintenant...'),
    dict(id='t5', title='Dark Neon Beat', artist_id='a3', artist_name='416 Beats Lab', album='Instrumentals 416',
         audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
         cover_url='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600',
         duration_seconds=180, plays_count=65400, release_date='2026', genre='Instrumental / Beat',
         lyrics='[Instrumental Beat 416 - Beats Lab]'),
]

MERCH = [
    dict(id='merch_1', sku='416-HOODIE-LTD-01', name='Hoodie Oversized 416 Records (Édition Limitée)', price='79.99',
         description='Hoodie noir épais 450 GSM avec logo sérigraphié 41R violet & blanc, coupe streetwear oversize.',
         image_url='https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600',
         category='Hoodies', available_sizes=['S', 'M', 'L', 'XL', 'XXL'], stock_quantity=45, is_new=True),
    dict(id='merch_2', sku='416-TSHIRT-HW-02', name='T-Shirt Urban Heavyweight 416', price='39.99',
         description='100% Coton peigné premium 240 GSM, impression logo graffiti 416 sur le torse et dos.',
         image_url='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600',
         category='T-Shirts', available_sizes=['S', 'M', 'L', 'XL'], stock_quantity=120, is_new=False),
    dict(id='merch_3', sku='416-VINYL-ALLSTARS-03', name='Vinyle Collector 416 All Stars (33T Purple Wax)', price='49.99',
         description='Double vinyle violet marbré contenant tous les classiques de la maison de production 416.',
         image_url='https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=600',
         category='Vinyles', available_sizes=['Taille Unique'], stock_quantity=25, is_new=True),
    dict(id='merch_4', sku='416-CAP-3D-04', name='Casquette Curved Logo 41R 3D Embroidery', price='34.99',
         description='Casquette strapback noire avec broderie relief blanche et chiffres violets 4-1-6.',
         image_url='https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600',
         category='Casquettes', available_sizes=['Taille Unique'], stock_quantity=60, is_new=False),
]


class Command(BaseCommand):
    help = 'Ensemence la base avec le contenu réel 416 Records (idempotent)'

    def handle(self, *args, **options):
        for f in FILMS:
            Movie.objects.update_or_create(id=f['id'], defaults=f)
        for a in ARTISTES:
            Artist.objects.update_or_create(id=a['id'], defaults=a)
        for t in TITRES:
            data = dict(t)
            artist = Artist.objects.filter(id=data.pop('artist_id', None)).first()
            Track.objects.update_or_create(id=data['id'], defaults={**data, 'artist': artist})
        for m in MERCH:
            MerchItem.objects.update_or_create(id=m['id'], defaults=m)

        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'guymuzongo1234@gmail.com')
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin416')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin@416Records')
        if not User.objects.filter(email=email).exists():
            su = User.objects.create_superuser(username=username, email=email, password=password)
            UserProfile.objects.create(user=su, role='admin', is_premium=True,
                                       subscription_tier='vip_416', avatar_url='https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400')
            self.stdout.write(self.style.SUCCESS(f'Super-admin créé : {email}'))
        else:
            self.stdout.write('Super-admin déjà présent.')

        self.stdout.write(self.style.SUCCESS(
            f'Base 416 ensemencée : {Movie.objects.count()} films, {Artist.objects.count()} artistes, '
            f'{Track.objects.count()} titres, {MerchItem.objects.count()} articles merch.'))
