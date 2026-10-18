import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/watchlist_provider.dart';
import '../providers/movies_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/movie_card.dart';

class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final watchlist = Provider.of<WatchlistProvider>(context);
    final moviesProv = Provider.of<MoviesProvider>(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    final savedMovies = moviesProv.movies.where((m) => watchlist.isMovieSaved(m.id)).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('MA LISTE DE LECTURE 416'),
      ),
      body: savedMovies.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bookmark_outline, size: 60, color: AppTheme.textMuted),
                  SizedBox(height: 14),
                  Text(
                    'Votre liste est vide',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Ajoutez des films et séries 416 Records pour les retrouver facilement ici.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                  ),
                ],
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: isMobile ? 2 : (screenWidth ~/ 160).clamp(2, 6),
                childAspectRatio: 0.65,
                crossAxisSpacing: 10,
                mainAxisSpacing: 12,
              ),
              itemCount: savedMovies.length,
              itemBuilder: (context, index) {
                return MovieCard(
                  movie: savedMovies[index],
                  width: double.infinity,
                );
              },
            ),
    );
  }
}
