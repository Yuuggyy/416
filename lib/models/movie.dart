class Movie {
  final String id;
  final String title;
  final String subtitle;
  final String description;
  final String posterUrl;
  final String bannerUrl;
  final String videoUrl;
  final String trailerUrl;
  final String category; // 'Films', 'Documentaires', 'Clips', 'Séries', 'Exclusifs'
  final int durationMinutes;
  final int releaseYear;
  final double rating;
  final String ageRating; // 'ALL', '12+', '16+', '18+'
  final List<String> tags;
  final String director;
  final List<String> cast;
  final bool isFeatured;
  final bool isPremiumOnly;
  final bool isPublished;
  final int viewsCount;

  Movie({
    required this.id,
    required this.title,
    this.subtitle = '',
    required this.description,
    required this.posterUrl,
    required this.bannerUrl,
    required this.videoUrl,
    this.trailerUrl = '',
    required this.category,
    required this.durationMinutes,
    required this.releaseYear,
    this.rating = 4.8,
    this.ageRating = 'ALL',
    required this.tags,
    this.director = '416 Productions',
    required this.cast,
    this.isFeatured = false,
    this.isPremiumOnly = false,
    this.isPublished = true,
    this.viewsCount = 0,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      subtitle: json['subtitle'] ?? '',
      description: json['description'] ?? '',
      posterUrl: json['poster_url'] ?? json['posterUrl'] ?? '',
      bannerUrl: json['banner_url'] ?? json['bannerUrl'] ?? '',
      videoUrl: json['video_url'] ?? json['videoUrl'] ?? '',
      trailerUrl: json['trailer_url'] ?? json['trailerUrl'] ?? '',
      category: json['category'] ?? 'Films',
      durationMinutes: json['duration_minutes'] ?? json['durationMinutes'] ?? 90,
      releaseYear: json['release_year'] ?? json['releaseYear'] ?? 2026,
      rating: (json['rating'] ?? 4.8).toDouble(),
      ageRating: json['age_rating'] ?? json['ageRating'] ?? 'ALL',
      tags: List<String>.from(json['tags'] ?? []),
      director: json['director'] ?? '416 Productions',
      cast: List<String>.from(json['cast'] ?? []),
      isFeatured: json['is_featured'] ?? json['isFeatured'] ?? false,
      isPremiumOnly: json['is_premium_only'] ?? json['isPremiumOnly'] ?? false,
      isPublished: json['is_published'] ?? json['isPublished'] ?? true,
      viewsCount: json['views_count'] ?? json['viewsCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'description': description,
      'poster_url': posterUrl,
      'banner_url': bannerUrl,
      'video_url': videoUrl,
      'trailer_url': trailerUrl,
      'category': category,
      'duration_minutes': durationMinutes,
      'release_year': releaseYear,
      'rating': rating,
      'age_rating': ageRating,
      'tags': tags,
      'director': director,
      'cast': cast,
      'is_featured': isFeatured,
      'is_premium_only': isPremiumOnly,
      'is_published': isPublished,
      'views_count': viewsCount,
    };
  }
}
