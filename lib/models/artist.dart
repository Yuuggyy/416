class Artist {
  final String id;
  final String name;
  final String realName;
  final String role; // 'Rappeur', 'Beatmaker', 'Réalisateur', 'Producteur'
  final String bio;
  final String avatarUrl;
  final String bannerUrl;
  final String socialInstagram;
  final String socialYoutube;
  final String socialSpotify;
  final List<String> topTracksIds;
  final int startYear;
  final bool isVerified;

  Artist({
    required this.id,
    required this.name,
    this.realName = '',
    required this.role,
    required this.bio,
    required this.avatarUrl,
    required this.bannerUrl,
    this.socialInstagram = '',
    this.socialYoutube = '',
    this.socialSpotify = '',
    this.topTracksIds = const [],
    this.startYear = 2020,
    this.isVerified = true,
  });

  factory Artist.fromJson(Map<String, dynamic> json) {
    return Artist(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      realName: json['real_name'] ?? json['realName'] ?? '',
      role: json['role'] ?? 'Artiste',
      bio: json['bio'] ?? '',
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'] ?? '',
      bannerUrl: json['banner_url'] ?? json['bannerUrl'] ?? '',
      socialInstagram: json['social_instagram'] ?? json['socialInstagram'] ?? '',
      socialYoutube: json['social_youtube'] ?? json['socialYoutube'] ?? '',
      socialSpotify: json['social_spotify'] ?? json['socialSpotify'] ?? '',
      topTracksIds: List<String>.from(json['top_tracks_ids'] ?? []),
      startYear: json['start_year'] ?? json['startYear'] ?? 2020,
      isVerified: json['is_verified'] ?? json['isVerified'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'real_name': realName,
      'role': role,
      'bio': bio,
      'avatar_url': avatarUrl,
      'banner_url': bannerUrl,
      'social_instagram': socialInstagram,
      'social_youtube': socialYoutube,
      'social_spotify': socialSpotify,
      'top_tracks_ids': topTracksIds,
      'start_year': startYear,
      'is_verified': isVerified,
    };
  }
}
