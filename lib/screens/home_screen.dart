import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/movies_provider.dart';
import '../providers/artists_provider.dart';
import '../providers/merch_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/hero_banner.dart';
import '../widgets/movie_row.dart';
import 'merch_screen.dart';
import 'artists_screen.dart';
import 'admin_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final moviesProv = Provider.of<MoviesProvider>(context);
    final artistsProv = Provider.of<ArtistsProvider>(context);
    final merchProv = Provider.of<MerchProvider>(context);

    final featured = moviesProv.featuredMovie;

    return RefreshIndicator(
      onRefresh: () async {
        await moviesProv.loadMovies();
        await artistsProv.loadArtists();
        await merchProv.loadMerch();
      },
      color: AppTheme.primary,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Featured Hero Banner if present
            if (featured != null) HeroBanner(movie: featured),

            // Clean Empty State when Database is empty for fresh manual entry
            if (moviesProv.movies.isEmpty) ...[
              Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.cloud_done, size: 60, color: AppTheme.primaryLight),
                    const SizedBox(height: 12),
                    const Text(
                      'Base de Données Prête & Connectée',
                      style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Toutes les données fictives ont été réinitialisées. Le système lit désormais en direct votre base de données.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AdminScreen()),
                        );
                      },
                      icon: const Icon(Icons.add_circle_outline),
                      label: const Text('AJOUTER DU CONTENU (ADMIN)'),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Category Movie Rows
            if (moviesProv.movies.isNotEmpty) ...[
              MovieRow(
                title: '🔥 Nouveautés & Exclusivités 416',
                movies: moviesProv.movies,
              ),

              MovieRow(
                title: '🎬 Films & Longs-Métrages',
                movies: moviesProv.movies.where((m) => m.category == 'Films').toList(),
              ),

              MovieRow(
                title: '🎤 Documentaires Street & Coulisses',
                movies: moviesProv.movies.where((m) => m.category == 'Documentaires').toList(),
              ),
            ],

            // Artists Spotlight Row
            if (artistsProv.artists.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      '👑 Roster Artistes 416',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ArtistsScreen()),
                        );
                      },
                      child: const Text('Voir le Roster', style: TextStyle(color: AppTheme.primaryLight)),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 140,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: artistsProv.artists.length,
                  itemBuilder: (context, index) {
                    final artist = artistsProv.artists[index];
                    return Container(
                      margin: const EdgeInsets.only(right: 16),
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ArtistDetailScreen(artist: artist),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(50),
                        child: Column(
                          children: [
                            CircleAvatar(
                              radius: 42,
                              backgroundColor: AppTheme.primary.withOpacity(0.3),
                              backgroundImage: NetworkImage(artist.avatarUrl),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              artist.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              artist.role,
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Merch Boutique Banner
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.surface, AppTheme.surfaceLight],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '416 MERCH STORE',
                          style: TextStyle(
                            color: AppTheme.primaryLight,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Collection Officielle Streetwear & Vinyles',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const MerchScreen()),
                            );
                          },
                          child: const Text('DECOUVRIR LA BOUTIQUE'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=300',
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 100), // Spacing for MiniPlayer
          ],
        ),
      ),
    );
  }
}
