import 'package:flutter/material.dart';

class WatchlistProvider extends ChangeNotifier {
  final Set<String> _savedMovieIds = {'m1', 'm3'};
  final Set<String> _likedTrackIds = {'t1', 't3'};

  Set<String> get savedMovieIds => _savedMovieIds;
  Set<String> get likedTrackIds => _likedTrackIds;

  bool isMovieSaved(String movieId) => _savedMovieIds.contains(movieId);
  bool isTrackLiked(String trackId) => _likedTrackIds.contains(trackId);

  void toggleMovieSaved(String movieId) {
    if (_savedMovieIds.contains(movieId)) {
      _savedMovieIds.remove(movieId);
    } else {
      _savedMovieIds.add(movieId);
    }
    notifyListeners();
  }

  void toggleTrackLiked(String trackId) {
    if (_likedTrackIds.contains(trackId)) {
      _likedTrackIds.remove(trackId);
    } else {
      _likedTrackIds.add(trackId);
    }
    notifyListeners();
  }
}
