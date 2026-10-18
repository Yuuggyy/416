class User {
  final String id;
  final String email;
  final String username;
  final String fullName;
  final String avatarUrl;
  final String role; // 'user', 'artist', 'admin'
  final bool isPremium;
  final String subscriptionTier; // 'free', 'premium_monthly', 'vip_416'
  final String? subscriptionExpiry;
  final String token;
  final List<String> watchlistMovieIds;
  final List<String> likedTrackIds;

  User({
    required this.id,
    required this.email,
    required this.username,
    this.fullName = '',
    this.avatarUrl = '',
    this.role = 'user',
    this.isPremium = false,
    this.subscriptionTier = 'free',
    this.subscriptionExpiry,
    this.token = '',
    this.watchlistMovieIds = const [],
    this.likedTrackIds = const [],
  });

  bool get isAdmin => role == 'admin' || email.contains('admin');

  factory User.fromJson(Map<String, dynamic> json, {String token = ''}) {
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      fullName: json['full_name'] ?? json['fullName'] ?? '',
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'] ?? '',
      role: json['role'] ?? 'user',
      isPremium: json['is_premium'] ?? json['isPremium'] ?? false,
      subscriptionTier: json['subscription_tier'] ?? json['subscriptionTier'] ?? 'free',
      subscriptionExpiry: json['subscription_expiry'] ?? json['subscriptionExpiry'],
      token: token.isNotEmpty ? token : (json['token'] ?? ''),
      watchlistMovieIds: List<String>.from(json['watchlist_movie_ids'] ?? []),
      likedTrackIds: List<String>.from(json['liked_track_ids'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'full_name': fullName,
      'avatar_url': avatarUrl,
      'role': role,
      'is_premium': isPremium,
      'subscription_tier': subscriptionTier,
      'subscription_expiry': subscriptionExpiry,
      'token': token,
      'watchlist_movie_ids': watchlistMovieIds,
      'liked_track_ids': likedTrackIds,
    };
  }

  User copyWith({
    String? fullName,
    String? avatarUrl,
    bool? isPremium,
    String? subscriptionTier,
    String? subscriptionExpiry,
    List<String>? watchlistMovieIds,
    List<String>? likedTrackIds,
  }) {
    return User(
      id: id,
      email: email,
      username: username,
      fullName: fullName ?? this.fullName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role,
      isPremium: isPremium ?? this.isPremium,
      subscriptionTier: subscriptionTier ?? this.subscriptionTier,
      subscriptionExpiry: subscriptionExpiry ?? this.subscriptionExpiry,
      token: token,
      watchlistMovieIds: watchlistMovieIds ?? this.watchlistMovieIds,
      likedTrackIds: likedTrackIds ?? this.likedTrackIds,
    );
  }
}
