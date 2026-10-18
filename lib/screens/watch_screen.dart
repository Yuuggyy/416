import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/movie.dart';
import '../theme/app_theme.dart';
import '../providers/watchlist_provider.dart';
import '../providers/movies_provider.dart';
import '../widgets/video_player_widget.dart';
import '../widgets/movie_card.dart';

class WatchScreen extends StatelessWidget {
  final Movie movie;

  const WatchScreen({super.key, required this.movie});

  @override
  Widget build(BuildContext context) {
    final watchlist = Provider.of<WatchlistProvider>(context);
    final moviesProv = Provider.of<MoviesProvider>(context);
    final isSaved = watchlist.isMovieSaved(movie.id);

    final related = moviesProv.movies.where((m) => m.id != movie.id).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Custom Video Player Component
              VideoPlayerWidget(movie: movie),

              // Title & Info
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            movie.category.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          '${movie.releaseYear} • ${movie.durationMinutes} min',
                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                        ),
                        const Spacer(),
                        Row(
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              '${movie.rating}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Text(
                      movie.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (movie.subtitle.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        movie.subtitle,
                        style: const TextStyle(
                          color: AppTheme.primaryLight,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),

                    // Actions Bar (Watchlist, Share, Download)
                    Row(
                      children: [
                        OutlinedButton.icon(
                          onPressed: () {
                            watchlist.toggleMovieSaved(movie.id);
                          },
                          icon: Icon(
                            isSaved ? Icons.check : Icons.bookmark_add,
                            color: isSaved ? AppTheme.primaryLight : Colors.white,
                          ),
                          label: Text(
                            isSaved ? 'Dans ma liste' : 'Ajouter à ma liste',
                            style: TextStyle(
                              color: isSaved ? AppTheme.primaryLight : Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        IconButton(
                          icon: const Icon(Icons.share, color: Colors.white),
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Lien de partage copié !')),
                            );
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),
                    const Divider(color: AppTheme.surfaceBorder),
                    const SizedBox(height: 12),

                    // Synopsis
                    const Text(
                      'Synopsis',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      movie.description,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Credits: Director & Cast
                    Text(
                      'Réalisateur: ${movie.director}',
                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                    if (movie.cast.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Casting: ${movie.cast.join(", ")}',
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                      ),
                    ],
                    const SizedBox(height: 24),

                    // Recommendations
                    if (related.isNotEmpty) ...[
                      const Text(
                        'À REGARDER AUSSI',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 240,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: related.length,
                          itemBuilder: (context, index) {
                            return MovieCard(movie: related[index]);
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
