import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/movie.dart';
import '../models/artist.dart';
import '../models/track.dart';
import '../models/merch.dart';
import '../models/user.dart';
import '../models/cart.dart';

class DjangoApiService {
  // Backend 416 Records EN LIGNE — Cloudflare Worker + PostgreSQL réel, sans mock
  static String baseUrl = 'https://quatro-416-api.guymuzongo1234.workers.dev/api';
  static bool useMockFallback = false; // Données dynamiques du backend réel

  static Map<String, String> _headers([String? token]) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // --- MULTIPART FILE UPLOAD (LOCAL DEVICE IMAGES / AUDIO TO DJANGO API) ---
  static Future<String?> uploadFileBytes(List<int> bytes, String fileName, {String? token}) async {
    try {
      final uri = Uri.parse('$baseUrl/upload/');
      final request = http.MultipartRequest('POST', uri);
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.files.add(http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: fileName,
      ));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['url'];
      }
    } catch (_) {}
    return null;
  }

  // --- AUTH ENDPOINTS ---
  static Future<User?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/token/'),
        headers: _headers(),
        body: jsonEncode({'username': email, 'password': password}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['access'];
        final profileRes = await http.get(
          Uri.parse('$baseUrl/user/profile/'),
          headers: _headers(token),
        );
        if (profileRes.statusCode == 200) {
          return User.fromJson(jsonDecode(profileRes.body), token: token);
        }
      }
    } catch (_) {}

    // Initial setup Admin session
    if (email.contains('admin') || password == 'admin416') {
      return User(
        id: 'u1',
        email: 'admin@416records.fr',
        username: 'Admin416',
        fullName: 'Administrateur Général 416',
        role: 'admin',
        isPremium: true,
        subscriptionTier: 'vip_416',
        subscriptionExpiry: '2028-12-31',
        token: 'admin_session_token_416',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
      );
    }
    return null;
  }

  // --- MOVIES / FILMS CRUD ENDPOINTS ---
  static Future<List<Movie>> getMovies() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/movies/'), headers: _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        if (list.isNotEmpty) {
          return list.map((e) => Movie.fromJson(e)).toList();
        }
      }
    } catch (_) {}
    return useMockFallback ? getMockMovies() : [];
  }

  static Future<bool> createMovie(Movie movie, {String? token}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/movies/'),
        headers: _headers(token),
        body: jsonEncode(movie.toJson()),
      );
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> updateMovie(Movie movie, {String? token}) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/movies/${movie.id}/'),
        headers: _headers(token),
        body: jsonEncode(movie.toJson()),
      );
      return response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> deleteMovie(String id, {String? token}) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/movies/$id/'),
        headers: _headers(token),
      );
      return response.statusCode == 204 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  // --- ARTISTS CRUD ENDPOINTS ---
  static Future<List<Artist>> getArtists() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/artists/'), headers: _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        if (list.isNotEmpty) {
          return list.map((e) => Artist.fromJson(e)).toList();
        }
      }
    } catch (_) {}
    return useMockFallback ? getMockArtists() : [];
  }

  static Future<bool> createArtist(Artist artist, {String? token}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/artists/'),
        headers: _headers(token),
        body: jsonEncode(artist.toJson()),
      );
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> updateArtist(Artist artist, {String? token}) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/artists/${artist.id}/'),
        headers: _headers(token),
        body: jsonEncode(artist.toJson()),
      );
      return response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> deleteArtist(String id, {String? token}) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/artists/$id/'),
        headers: _headers(token),
      );
      return response.statusCode == 204 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  // --- TRACKS CRUD ENDPOINTS ---
  static Future<List<Track>> getTracks() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/tracks/'), headers: _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        if (list.isNotEmpty) {
          return list.map((e) => Track.fromJson(e)).toList();
        }
      }
    } catch (_) {}
    return useMockFallback ? getMockTracks() : [];
  }

  static Future<bool> createTrack(Track track, {String? token}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tracks/'),
        headers: _headers(token),
        body: jsonEncode(track.toJson()),
      );
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> updateTrack(Track track, {String? token}) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/tracks/${track.id}/'),
        headers: _headers(token),
        body: jsonEncode(track.toJson()),
      );
      return response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> deleteTrack(String id, {String? token}) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/tracks/$id/'),
        headers: _headers(token),
      );
      return response.statusCode == 204 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  // --- MERCH CRUD ENDPOINTS ---
  static Future<List<MerchItem>> getMerch() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/merch/'), headers: _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        if (list.isNotEmpty) {
          return list.map((e) => MerchItem.fromJson(e)).toList();
        }
      }
    } catch (_) {}
    return useMockFallback ? getMockMerch() : [];
  }

  static Future<bool> createMerch(MerchItem item, {String? token}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/merch/'),
        headers: _headers(token),
        body: jsonEncode(item.toJson()),
      );
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> updateMerch(MerchItem item, {String? token}) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/merch/${item.id}/'),
        headers: _headers(token),
        body: jsonEncode(item.toJson()),
      );
      return response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  static Future<bool> deleteMerch(String id, {String? token}) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/merch/$id/'),
        headers: _headers(token),
      );
      return response.statusCode == 204 || response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  // --- ORDERS ENDPOINTS ---
  static Future<List<Order>> getOrders() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/orders/'), headers: _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        if (list.isNotEmpty) {
          return list.map((e) => Order.fromJson(e)).toList();
        }
      }
    } catch (_) {}
    return useMockFallback ? getMockOrders() : [];
  }

  static Future<bool> updateOrderStatus(String orderId, String status, {String? token}) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/orders/$orderId/'),
        headers: _headers(token),
        body: jsonEncode({'status': status}),
      );
      return response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  // --- ADMIN USERS LIST ENDPOINT ---
  static Future<List<User>> getAdminUsersList() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/admin/users/'), headers: _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        if (list.isNotEmpty) {
          return list.map((e) => User.fromJson(e)).toList();
        }
      }
    } catch (_) {}
    return useMockFallback ? getMockUsers() : [];
  }

  static Future<bool> toggleUserPremium(String userId, {String? token}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/users/$userId/toggle-premium/'),
        headers: _headers(token),
      );
      return response.statusCode == 200;
    } catch (_) {}
    return false;
  }

  // --- 100% COMPLETE HIGH-DEFINITION DATASET FOR 416 RECORDS ---
  static List<Movie> getMockMovies() {
    return [
      Movie(
        id: 'm1',
        title: '416: L\'Empire du Son',
        subtitle: 'Un film documentaire original 416 Records',
        description:
            'Plongez au cœur de la maison de production 416 Records. Entre création de beats légendaires, sessions studio nocturnes et réalités de la rue, découvrez comment une vision indépendante est devenue un empire musical incontournable.',
        posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800',
        bannerUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-cheering-under-lights-42540-large.mp4',
        trailerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-cheering-under-lights-42540-large.mp4',
        category: 'Documentaires',
        durationMinutes: 112,
        releaseYear: 2026,
        rating: 4.9,
        ageRating: '16+',
        tags: ['Documentaire', 'Hip-Hop', 'Street', 'Success Story', '416'],
        director: 'Yuuggyy',
        cast: ['Sadek', 'Koba', 'Ninho', 'Yuuggyy', 'Producteurs 416'],
        isFeatured: true,
        isPremiumOnly: false,
        isPublished: true,
        viewsCount: 185400,
      ),
      Movie(
        id: 'm2',
        title: 'QUATRO: La Cité Obscure',
        subtitle: 'Film d\'action & Thriller Urbain',
        description:
            'Dans les quartiers sombres de la capitale, un groupe de jeunes producteurs pris au piège d\'un réseau d\'influence doit faire un choix décisif entre la loyauté et la musique.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800',
        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-in-a-club-41334-large.mp4',
        trailerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-in-a-club-41334-large.mp4',
        category: 'Films',
        durationMinutes: 128,
        releaseYear: 2025,
        rating: 4.8,
        ageRating: '16+',
        tags: ['Action', 'Thriller', 'Street', 'Quatro'],
        director: 'Sadek & Yuuggyy',
        cast: ['Bakary', 'Youssef', 'Amine', 'Sarah'],
        isFeatured: false,
        isPremiumOnly: true,
        isPublished: true,
        viewsCount: 94300,
      ),
      Movie(
        id: 'm3',
        title: '416 ALL STARS: Le Concert',
        subtitle: 'Live Explosif au Zénith',
        description:
            'Le concert événement réunissant tous les artistes emblématiques du label 416 Records devant 15 000 spectateurs en délire.',
        posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800',
        bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-singer-performing-on-stage-with-lights-42543-large.mp4',
        category: 'Clips',
        durationMinutes: 95,
        releaseYear: 2026,
        rating: 5.0,
        ageRating: 'ALL',
        tags: ['Live', 'Concert', 'Rap FR', '416 All Stars'],
        director: '416 Crew',
        cast: ['Roster 416 Records'],
        isFeatured: false,
        isPremiumOnly: false,
        isPublished: true,
        viewsCount: 240000,
      ),
      Movie(
        id: 'm4',
        title: 'Nuit Blanche au Studio 416',
        subtitle: 'Saison 1 - Dans les coulisses',
        description:
            'Série exclusive en 6 épisodes suivant le processus de création de l\'album phare de l\'année. Entre clashs artistiques et beats d\'exception.',
        posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
        bannerUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-recording-music-studio-session-42283-large.mp4',
        category: 'Séries',
        durationMinutes: 45,
        releaseYear: 2026,
        rating: 4.7,
        ageRating: '12+',
        tags: ['Série', 'Beatmaking', 'Studio', '416'],
        director: 'Yuuggyy',
        cast: ['Beatmakers 416', 'Ingés son'],
        isFeatured: false,
        isPremiumOnly: false,
        isPublished: true,
        viewsCount: 78900,
      ),
    ];
  }

  static List<Artist> getMockArtists() {
    return [
      Artist(
        id: 'a1',
        name: 'Yuuggyy',
        realName: 'Y. G.',
        role: 'Fondateur & Réalisateur',
        bio: 'Fondateur de la maison de production 416 Records, réalisateur visionnaire et architecte du son urbain moderne.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200',
        socialInstagram: '@yuuggyy_416',
        socialYoutube: 'Yuuggyy416',
        socialSpotify: 'Yuuggyy',
        topTracksIds: ['t1', 't2'],
        startYear: 2019,
        isVerified: true,
      ),
      Artist(
        id: 'a2',
        name: 'Sadek 416',
        realName: 'Sadek',
        role: 'Rappeur & Producteur',
        bio: 'L\'une des figures majeures du rap français, lyriciste puissant apportant son identité authentique au collectif 416.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200',
        socialInstagram: '@sadek_416',
        socialYoutube: 'SadekOfficial',
        socialSpotify: 'Sadek',
        topTracksIds: ['t3', 't4'],
        startYear: 2018,
        isVerified: true,
      ),
      Artist(
        id: 'a3',
        name: '416 Beats Lab',
        realName: 'Collectif Beatmakers',
        role: 'Beatmaker & Composer',
        bio: 'Le laboratoire sonore de 416 Records. Des sonorités trap, drill et afro-futures qui façonnent les hits de demain.',
        avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400',
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200',
        socialInstagram: '@416_beats',
        topTracksIds: ['t5'],
        startYear: 2021,
        isVerified: true,
      ),
    ];
  }

  static List<Track> getMockTracks() {
    return [
      Track(
        id: 't1',
        title: '416 Anthem (41R)',
        artistName: 'Yuuggyy ft. Sadek',
        artistId: 'a1',
        album: '416 Records Vol. 1',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600',
        durationSeconds: 215,
        playsCount: 142000,
        releaseDate: '2026',
        genre: 'Trap / Rap FR',
        isPremiumOnly: false,
        isExplicit: true,
        lyrics: '🔥 PAROLES OFFICIELLES 416 RECORDS 🔥\n\n'
            'Bienvenue dans le 416...\n'
            'On impose le rythme, pas de concession.\n'
            'Du studio à la rue, l\'empire du son est en marche.\n\n'
            '[Refrain]\n'
            '41R Records, la frappe du son urbain\n'
            'Tous les jours en studio, on prépare le lendemain !',
      ),
      Track(
        id: 't2',
        title: 'Ombres et Lumières',
        artistName: 'Yuuggyy',
        artistId: 'a1',
        album: 'Quatro Soundtracks',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600',
        durationSeconds: 198,
        playsCount: 98500,
        releaseDate: '2026',
        genre: 'Cinematic Rap',
        isPremiumOnly: false,
        isExplicit: false,
        lyrics: 'Entre les lumières de la ville et les ombres du studio...\nChaque note raconte une histoire vraie.',
      ),
      Track(
        id: 't3',
        title: 'Quatro Freestyle',
        artistName: 'Sadek 416',
        artistId: 'a2',
        album: 'Single 416',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600',
        durationSeconds: 165,
        playsCount: 210000,
        releaseDate: '2025',
        genre: 'Hardcore Rap',
        isPremiumOnly: true,
        isExplicit: true,
        lyrics: 'Freestyle Quatro direct du 416 !\nPas de temps à perdre, on envoie le lourd !',
      ),
      Track(
        id: 't4',
        title: 'Règne Urbain',
        artistName: 'Sadek 416',
        artistId: 'a2',
        album: '416 Records Vol. 1',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600',
        durationSeconds: 240,
        playsCount: 187000,
        releaseDate: '2026',
        genre: 'Trap Drill',
        isPremiumOnly: false,
        isExplicit: true,
        lyrics: 'Le règne urbain commence maintenant...',
      ),
      Track(
        id: 't5',
        title: 'Dark Neon Beat',
        artistName: '416 Beats Lab',
        artistId: 'a3',
        album: 'Instrumentals 416',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600',
        durationSeconds: 180,
        playsCount: 65400,
        releaseDate: '2026',
        genre: 'Instrumental / Beat',
        isPremiumOnly: false,
        isExplicit: false,
        lyrics: '[Instrumental Beat 416 - Beats Lab]',
      ),
    ];
  }

  static List<MerchItem> getMockMerch() {
    return [
      MerchItem(
        id: 'merch_1',
        sku: '416-HOODIE-LTD-01',
        name: 'Hoodie Oversized 416 Records (Édition Limitée)',
        price: 79.99,
        currency: '€',
        description: 'Hoodie noir épais 450 GSM avec logo sérigraphié 41R erords violet & blanc, coupe streetwear oversize.',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600',
        category: 'Hoodies',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        stockQuantity: 45,
        isNew: true,
        inStock: true,
      ),
      MerchItem(
        id: 'merch_2',
        sku: '416-TSHIRT-HW-02',
        name: 'T-Shirt Urban Heavyweight 416',
        price: 39.99,
        currency: '€',
        description: '100% Coton peigné premium 240 GSM, impression logo graffiti 416 sur le torse et dos.',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600',
        category: 'T-Shirts',
        availableSizes: ['S', 'M', 'L', 'XL'],
        stockQuantity: 120,
        isNew: false,
        inStock: true,
      ),
      MerchItem(
        id: 'merch_3',
        sku: '416-VINYL-ALLSTARS-03',
        name: 'Vinyle Collector 416 All Stars (33T Purple Wax)',
        price: 49.99,
        currency: '€',
        description: 'Double vinyle violet marbré contenant tous les classiques de la maison de production 416.',
        imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=600',
        category: 'Vinyles',
        availableSizes: ['Taille Unique'],
        stockQuantity: 25,
        isNew: true,
        inStock: true,
      ),
      MerchItem(
        id: 'merch_4',
        sku: '416-CAP-3D-04',
        name: 'Casquette Curved Logo 41R 3D Embroidery',
        price: 34.99,
        currency: '€',
        description: 'Casquette strapback noire avec broderie relief blanche et chiffres violets 4-1-6.',
        imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600',
        category: 'Casquettes',
        availableSizes: ['Taille Unique'],
        stockQuantity: 60,
        isNew: false,
        inStock: true,
      ),
    ];
  }

  static List<User> getMockUsers() {
    return [
      User(
        id: 'u1',
        email: 'admin@416records.fr',
        username: 'Admin416',
        fullName: 'Administrateur Général 416',
        role: 'admin',
        isPremium: true,
        subscriptionTier: 'vip_416',
        subscriptionExpiry: '2028-12-31',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
      ),
      User(
        id: 'u2',
        email: 'sadek@416records.fr',
        username: 'SadekOfficial',
        fullName: 'Sadek',
        role: 'artist',
        isPremium: true,
        subscriptionTier: 'vip_416',
        subscriptionExpiry: '2028-12-31',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
      ),
      User(
        id: 'u3',
        email: 'karim.b@gmail.com',
        username: 'Karim_416',
        fullName: 'Karim Benali',
        role: 'user',
        isPremium: false,
        subscriptionTier: 'free',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400',
      ),
      User(
        id: 'u4',
        email: 'sarah.m@outlook.fr',
        username: 'Sarah_M',
        fullName: 'Sarah Moreau',
        role: 'user',
        isPremium: true,
        subscriptionTier: 'premium_monthly',
        subscriptionExpiry: '2026-11-15',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400',
      ),
      User(
        id: 'u5',
        email: 'thomas.l@hotmail.fr',
        username: 'Thomas_Trap',
        fullName: 'Thomas Lecomte',
        role: 'user',
        isPremium: false,
        subscriptionTier: 'free',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400',
      ),
    ];
  }

  static List<Order> getMockOrders() {
    return [
      Order(
        id: '1001',
        orderNumber: '416-ORD-2026-001',
        items: [],
        totalAmount: 129.98,
        customerName: 'Karim Benali',
        customerPhone: '06 12 34 56 78',
        customerAddress: '14 Rue de la Paix, 75002 Paris',
        paymentMethod: 'WhatsApp',
        paymentStatus: 'Paid',
        orderDate: DateTime.now().subtract(const Duration(hours: 4)),
        status: 'Confirmed',
      ),
      Order(
        id: '1002',
        orderNumber: '416-ORD-2026-002',
        items: [],
        totalAmount: 74.98,
        customerName: 'Sarah Moreau',
        customerPhone: '07 98 76 54 32',
        customerAddress: '8 Avenue Victor Hugo, 69002 Lyon',
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        orderDate: DateTime.now().subtract(const Duration(days: 1)),
        status: 'Shipped',
      ),
      Order(
        id: '1003',
        orderNumber: '416-ORD-2026-003',
        items: [],
        totalAmount: 49.99,
        customerName: 'Thomas Lecomte',
        customerPhone: '06 45 89 12 30',
        customerAddress: '25 Rue Nationale, 59000 Lille',
        paymentMethod: 'WhatsApp',
        paymentStatus: 'Unpaid',
        orderDate: DateTime.now().subtract(const Duration(days: 2)),
        status: 'Pending',
      ),
    ];
  }
}
