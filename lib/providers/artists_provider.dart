import 'package:flutter/material.dart';
import '../models/artist.dart';
import '../services/django_api_service.dart';

class ArtistsProvider extends ChangeNotifier {
  List<Artist> _artists = [];
  bool _isLoading = false;

  List<Artist> get artists => _artists;
  bool get isLoading => _isLoading;

  ArtistsProvider() {
    loadArtists();
  }

  Future<void> loadArtists() async {
    _isLoading = true;
    notifyListeners();
    _artists = await DjangoApiService.getArtists();
    _isLoading = false;
    notifyListeners();
  }

  Artist? getArtistById(String id) {
    try {
      return _artists.firstWhere((a) => a.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<void> addArtist(Artist artist) async {
    _artists.insert(0, artist);
    notifyListeners();
    await DjangoApiService.createArtist(artist);
  }

  Future<void> updateArtist(Artist artist) async {
    final index = _artists.indexWhere((a) => a.id == artist.id);
    if (index >= 0) {
      _artists[index] = artist;
      notifyListeners();
      await DjangoApiService.updateArtist(artist);
    }
  }

  Future<void> deleteArtist(String id) async {
    _artists.removeWhere((a) => a.id == id);
    notifyListeners();
    await DjangoApiService.deleteArtist(id);
  }
}
