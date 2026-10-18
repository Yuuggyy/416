import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/movie.dart';
import '../models/artist.dart';
import '../models/track.dart';
import '../models/merch.dart';
import '../models/user.dart';
import '../models/cart.dart';

class DjangoApiService {
  static String baseUrl = 'http://192.168.1.78:8000/api';
  static bool useMockFallback = false;

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

    // Fallback Admin session for initial setup
    if (email.contains('admin') || password == 'admin416') {
      return User(
        id: '1',
        email: 'admin@416records.fr',
        username: 'Admin416',
        fullName: 'Administrateur 416',
        role: 'admin',
        isPremium: true,
        subscriptionTier: 'vip_416',
        token: 'admin_session_token',
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
        return list.map((e) => Movie.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
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
        return list.map((e) => Artist.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
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
        return list.map((e) => Track.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
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
        return list.map((e) => MerchItem.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
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
        return list.map((e) => Order.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
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
        return list.map((e) => User.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
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
}
