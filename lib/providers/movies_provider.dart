import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/django_api_service.dart';

class MoviesProvider extends ChangeNotifier {
  List<Movie> _movies = [];
  bool _isLoading = false;
  String _selectedCategory = 'Tous';

  List<Movie> get movies => _movies;
  bool get isLoading => _isLoading;
  String get selectedCategory => _selectedCategory;

  Movie? get featuredMovie {
    try {
      return _movies.firstWhere((m) => m.isFeatured);
    } catch (_) {
      return _movies.isNotEmpty ? _movies.first : null;
    }
  }

  List<Movie> get filteredMovies {
    if (_selectedCategory == 'Tous') return _movies;
    return _movies.where((m) => m.category == _selectedCategory).toList();
  }

  MoviesProvider() {
    loadMovies();
  }

  Future<void> loadMovies() async {
    _isLoading = true;
    notifyListeners();
    _movies = await DjangoApiService.getMovies();
    _isLoading = false;
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> addMovie(Movie movie) async {
    _movies.insert(0, movie);
    notifyListeners();
    await DjangoApiService.createMovie(movie);
  }

  Future<void> updateMovie(Movie movie) async {
    final index = _movies.indexWhere((m) => m.id == movie.id);
    if (index >= 0) {
      _movies[index] = movie;
      notifyListeners();
      await DjangoApiService.updateMovie(movie);
    }
  }

  Future<void> deleteMovie(String id) async {
    _movies.removeWhere((m) => m.id == id);
    notifyListeners();
    await DjangoApiService.deleteMovie(id);
  }
}
