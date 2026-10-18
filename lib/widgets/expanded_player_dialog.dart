import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/audio_provider.dart';
import '../providers/watchlist_provider.dart';
import '../theme/app_theme.dart';
import 'logo_416.dart';

class ExpandedPlayerDialog extends StatelessWidget {
  const ExpandedPlayerDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final audio = Provider.of<AudioProvider>(context);
    final watchlist = Provider.of<WatchlistProvider>(context);
    final track = audio.currentTrack;

    if (track == null) return const SizedBox.shrink();

    final isLiked = watchlist.isTrackLiked(track.id);

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.88,
          decoration: BoxDecoration(
            color: AppTheme.background.withOpacity(0.88),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: AppTheme.primary.withOpacity(0.3), width: 1.5),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag Indicator
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceBorder,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Header Bar & Mode Toggle (Artwork vs Lyrics)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 30),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Row(
                      children: [
                        ChoiceChip(
                          label: const Text('TITRE', style: TextStyle(fontSize: 11)),
                          selected: !audio.showLyrics,
                          selectedColor: AppTheme.primary,
                          backgroundColor: AppTheme.surface,
                          labelStyle: TextStyle(
                            color: !audio.showLyrics ? Colors.white : AppTheme.textMuted,
                            fontWeight: FontWeight.bold,
                          ),
                          onSelected: (_) => audio.toggleShowLyrics(),
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('PAROLES', style: TextStyle(fontSize: 11)),
                          selected: audio.showLyrics,
                          selectedColor: AppTheme.secondary,
                          backgroundColor: AppTheme.surface,
                          labelStyle: TextStyle(
                            color: audio.showLyrics ? Colors.white : AppTheme.textMuted,
                            fontWeight: FontWeight.bold,
                          ),
                          onSelected: (_) => audio.toggleShowLyrics(),
                        ),
                      ],
                    ),
                    const Logo416Widget(size: 24, showText: false),
                  ],
                ),

                const SizedBox(height: 16),

                // Content View: Artwork OR Lyrics Display
                if (!audio.showLyrics) ...[
                  // Animated Album Vinyl Artwork
                  Center(
                    child: Container(
                      width: 210,
                      height: 210,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withOpacity(0.5),
                            blurRadius: 36,
                            spreadRadius: 4,
                          ),
                          BoxShadow(
                            color: AppTheme.secondary.withOpacity(0.3),
                            blurRadius: 24,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(105),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Image.network(
                              track.coverUrl,
                              width: 210,
                              height: 210,
                              fit: BoxFit.cover,
                            ),
                            // Center Vinyl Hole
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppTheme.background,
                                shape: BoxShape.circle,
                                border: Border.all(color: AppTheme.primaryLight, width: 2.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                        .animate(target: audio.isPlaying ? 1 : 0)
                        .scale(begin: const Offset(0.96, 0.96), end: const Offset(1.02, 1.02), duration: 1.seconds, curve: Curves.easeInOut)
                        .rotate(duration: 20.seconds),
                  ),
                ] else ...[
                  // Synced Lyrics View
                  Container(
                    height: 210,
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.surface.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.secondary.withOpacity(0.4)),
                    ),
                    child: SingleChildScrollView(
                      child: Text(
                        track.lyrics.isNotEmpty
                            ? track.lyrics
                            : '🔥 PAROLES OFFICIELLES 416 RECORDS 🔥\n\n'
                                'Bienvenue dans le 416...\n'
                                'On impose le rythme, pas de concession.\n'
                                'Du studio à la rue, l\'empire du son est en marche.\n\n'
                                '[Refrain]\n'
                                '41R Records, la frappe du son urbain\n'
                                'Tous les jours en studio, on prépare le lendemain !',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          height: 1.6,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Track Information & Like Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            track.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${track.artistName} • ${track.album}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        isLiked ? Icons.favorite : Icons.favorite_border,
                        color: isLiked ? AppTheme.secondary : AppTheme.textMuted,
                        size: 28,
                      ),
                      onPressed: () {
                        watchlist.toggleTrackLiked(track.id);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Slider & Progress
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: AppTheme.primaryLight,
                    inactiveTrackColor: AppTheme.surfaceBorder,
                    thumbColor: Colors.white,
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                    trackHeight: 4,
                  ),
                  child: Slider(
                    value: audio.positionSeconds.clamp(0, track.durationSeconds.toDouble()),
                    max: track.durationSeconds.toDouble(),
                    onChanged: (val) {
                      audio.seek(val);
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _formatTime(audio.positionSeconds.toInt()),
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      ),
                      Text(
                        track.formattedDuration,
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Playback Controls (Shuffle, Previous, Play/Pause, Next, Repeat)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.shuffle,
                        color: audio.isShuffle ? AppTheme.primaryLight : AppTheme.textMuted,
                      ),
                      onPressed: () {
                        audio.toggleShuffle();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(audio.isShuffle ? 'Mode Aléatoire Actif 🔀' : 'Mode Aléatoire Désactivé'),
                            duration: const Duration(seconds: 1),
                          ),
                        );
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_previous, color: Colors.white, size: 36),
                      onPressed: () {
                        audio.playPrevious();
                      },
                    ),
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary, AppTheme.secondary],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withOpacity(0.5),
                            blurRadius: 16,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: IconButton(
                        iconSize: 36,
                        icon: Icon(
                          audio.isPlaying ? Icons.pause : Icons.play_arrow,
                          color: Colors.white,
                        ),
                        onPressed: () {
                          audio.togglePlayPause();
                        },
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_next, color: Colors.white, size: 36),
                      onPressed: () {
                        audio.playNext();
                      },
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.repeat,
                        color: audio.isRepeat ? AppTheme.secondary : AppTheme.textMuted,
                      ),
                      onPressed: () {
                        audio.toggleRepeat();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(audio.isRepeat ? 'Répétition Active 🔂' : 'Répétition Désactivée'),
                            duration: const Duration(seconds: 1),
                          ),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }
}
