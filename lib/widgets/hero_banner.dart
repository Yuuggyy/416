import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../models/movie.dart';
import '../theme/app_theme.dart';
import '../providers/watchlist_provider.dart';
import '../screens/watch_screen.dart';

class HeroBanner extends StatelessWidget {
  final Movie movie;

  const HeroBanner({super.key, required this.movie});

  @override
  Widget build(BuildContext context) {
    final watchlist = Provider.of<WatchlistProvider>(context);
    final isSaved = watchlist.isMovieSaved(movie.id);
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      height: isMobile ? 360 : 460,
      width: double.infinity,
      color: AppTheme.background,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background Banner Image
          Image.network(
            movie.bannerUrl,
            width: double.infinity,
            height: isMobile ? 360 : 460,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: AppTheme.surface),
          ).animate().scale(begin: const Offset(1.05, 1.05), end: const Offset(1, 1), duration: 2.seconds, curve: Curves.easeOutCubic),

          // Gradient Overlays (Top & Bottom Fades)
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  AppTheme.background,
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0.1, 1.0],
              ),
            ),
          ),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.background,
                  Colors.transparent,
                ],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                stops: [0.0, 0.85],
              ),
            ),
          ),

          // Content Layer with FittedBox Guard against ANY overflow
          Positioned(
            bottom: isMobile ? 12 : 28,
            left: isMobile ? 12 : 24,
            right: isMobile ? 12 : 24,
            top: isMobile ? 40 : 80,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.bottomLeft,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: screenWidth > 640 ? 600 : screenWidth - 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Tag & Badge
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withOpacity(0.85),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '🔥 EXCLUSIF 416',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: isMobile ? 9 : 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                            const SizedBox(width: 2),
                            Text(
                              '${movie.rating}',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: isMobile ? 12 : 14,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${movie.releaseYear} • ${movie.durationMinutes} min',
                              style: TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: isMobile ? 11 : 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Movie Title
                    Text(
                      movie.title,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: isMobile ? 22 : 34,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                        shadows: const [
                          Shadow(color: Colors.black, blurRadius: 16, offset: Offset(0, 4)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Subtitle / Description
                    Text(
                      movie.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: isMobile ? 12 : 14,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Action Buttons
                    Wrap(
                      spacing: 10,
                      runSpacing: 8,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            gradient: const LinearGradient(
                              colors: [AppTheme.primary, AppTheme.secondary],
                            ),
                          ),
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => WatchScreen(movie: movie),
                                ),
                              );
                            },
                            icon: const Icon(Icons.play_arrow_rounded, size: 22),
                            label: Text(
                              'REGARDER',
                              style: TextStyle(fontSize: isMobile ? 11 : 13, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              padding: EdgeInsets.symmetric(
                                horizontal: isMobile ? 14 : 22,
                                vertical: isMobile ? 8 : 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed: () {
                            watchlist.toggleMovieSaved(movie.id);
                          },
                          icon: Icon(
                            isSaved ? Icons.check : Icons.add,
                            color: Colors.white,
                            size: 18,
                          ),
                          label: Text(
                            isSaved ? 'DANS MA LISTE' : 'MA LISTE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: isMobile ? 10 : 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.white.withOpacity(0.4), width: 1.2),
                            backgroundColor: Colors.black.withOpacity(0.4),
                            padding: EdgeInsets.symmetric(
                              horizontal: isMobile ? 12 : 18,
                              vertical: isMobile ? 8 : 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
