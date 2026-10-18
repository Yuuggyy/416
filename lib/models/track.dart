class Track {
  final String id;
  final String title;
  final String artistName;
  final String artistId;
  final String album;
  final String audioUrl;
  final String coverUrl;
  final int durationSeconds;
  final int playsCount;
  final String releaseDate;
  final String genre;
  final bool isPremiumOnly;
  final bool isExplicit;
  final String lyrics;

  Track({
    required this.id,
    required this.title,
    required this.artistName,
    required this.artistId,
    this.album = 'Single 416',
    required this.audioUrl,
    required this.coverUrl,
    required this.durationSeconds,
    this.playsCount = 0,
    this.releaseDate = '2026',
    this.genre = 'Rap FR',
    this.isPremiumOnly = false,
    this.isExplicit = false,
    this.lyrics = '',
  });

  factory Track.fromJson(Map<String, dynamic> json) {
    return Track(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      artistName: json['artist_name'] ?? json['artistName'] ?? (json['artist_details'] != null ? json['artist_details']['name'] : '416 All Stars'),
      artistId: json['artist']?.toString() ?? json['artist_id'] ?? json['artistId'] ?? '',
      album: json['album'] ?? 'Single 416',
      audioUrl: json['audio_url'] ?? json['audioUrl'] ?? '',
      coverUrl: json['cover_url'] ?? json['coverUrl'] ?? '',
      durationSeconds: json['duration_seconds'] ?? json['durationSeconds'] ?? 180,
      playsCount: json['plays_count'] ?? json['playsCount'] ?? 0,
      releaseDate: json['release_date'] ?? json['releaseDate'] ?? '2026',
      genre: json['genre'] ?? 'Rap FR',
      isPremiumOnly: json['is_premium_only'] ?? json['isPremiumOnly'] ?? false,
      isExplicit: json['is_explicit'] ?? json['isExplicit'] ?? false,
      lyrics: json['lyrics'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'artist_name': artistName,
      'artist_id': artistId,
      'album': album,
      'audio_url': audioUrl,
      'cover_url': coverUrl,
      'duration_seconds': durationSeconds,
      'plays_count': playsCount,
      'release_date': releaseDate,
      'genre': genre,
      'is_premium_only': isPremiumOnly,
      'is_explicit': isExplicit,
      'lyrics': lyrics,
    };
  }

  String get formattedDuration {
    final mins = durationSeconds ~/ 60;
    final secs = durationSeconds % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }
}
