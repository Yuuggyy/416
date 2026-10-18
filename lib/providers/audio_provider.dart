import 'package:flutter/material.dart';
import '../models/track.dart';
import '../services/django_api_service.dart';

class AudioProvider extends ChangeNotifier {
  Track? _currentTrack;
  bool _isPlaying = false;
  double _positionSeconds = 0.0;
  List<Track> _playlist = [];
  List<Track> _allTracks = [];
  int _currentIndex = 0;
  bool _isShuffle = false;
  bool _isRepeat = false;
  bool _showLyrics = false;

  Track? get currentTrack => _currentTrack;
  bool get isPlaying => _isPlaying;
  double get positionSeconds => _positionSeconds;
  List<Track> get playlist => _playlist;
  List<Track> get allTracks => _allTracks;
  bool get isShuffle => _isShuffle;
  bool get isRepeat => _isRepeat;
  bool get showLyrics => _showLyrics;

  AudioProvider() {
    loadTracks();
  }

  Future<void> loadTracks() async {
    _allTracks = await DjangoApiService.getTracks();
    if (_allTracks.isNotEmpty && _playlist.isEmpty) {
      _playlist = List.from(_allTracks);
    }
    notifyListeners();
  }

  void playTrack(Track track, {List<Track>? playlist}) {
    if (playlist != null) {
      _playlist = List.from(playlist);
      _currentIndex = _playlist.indexWhere((t) => t.id == track.id);
      if (_currentIndex < 0) _currentIndex = 0;
    }
    _currentTrack = track;
    _isPlaying = true;
    _positionSeconds = 0.0;
    notifyListeners();
  }

  void togglePlayPause() {
    if (_currentTrack != null) {
      _isPlaying = !_isPlaying;
      notifyListeners();
    }
  }

  void toggleShuffle() {
    _isShuffle = !_isShuffle;
    if (_isShuffle && _playlist.isNotEmpty) {
      _playlist.shuffle();
    } else {
      _playlist = List.from(_allTracks);
    }
    notifyListeners();
  }

  void toggleRepeat() {
    _isRepeat = !_isRepeat;
    notifyListeners();
  }

  void toggleShowLyrics() {
    _showLyrics = !_showLyrics;
    notifyListeners();
  }

  void playNext() {
    if (_playlist.isNotEmpty) {
      if (_isRepeat && _currentTrack != null) {
        _positionSeconds = 0.0;
        _isPlaying = true;
      } else if (_currentIndex < _playlist.length - 1) {
        _currentIndex++;
        playTrack(_playlist[_currentIndex]);
      } else {
        _currentIndex = 0;
        playTrack(_playlist[0]);
      }
      notifyListeners();
    }
  }

  void playPrevious() {
    if (_playlist.isNotEmpty && _currentIndex > 0) {
      _currentIndex--;
      playTrack(_playlist[_currentIndex]);
    }
  }

  void seek(double seconds) {
    _positionSeconds = seconds;
    notifyListeners();
  }

  void addTrack(Track track) {
    _allTracks.insert(0, track);
    _playlist.insert(0, track);
    notifyListeners();
  }

  void updateTrack(Track track) {
    final index = _allTracks.indexWhere((t) => t.id == track.id);
    if (index >= 0) {
      _allTracks[index] = track;
      notifyListeners();
    }
  }

  void deleteTrack(String id) {
    _allTracks.removeWhere((t) => t.id == id);
    _playlist.removeWhere((t) => t.id == id);
    notifyListeners();
  }
}
