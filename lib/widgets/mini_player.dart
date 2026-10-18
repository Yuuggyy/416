import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/audio_provider.dart';
import '../theme/app_theme.dart';
import 'expanded_player_dialog.dart';

class MiniPlayer extends StatelessWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context) {
    final audio = Provider.of<AudioProvider>(context);
    final track = audio.currentTrack;

    if (track == null) return const SizedBox.shrink();

    return Container(
      height: 64,
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.surface.withOpacity(0.95),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary.withOpacity(0.4), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.25),
            blurRadius: 20,
            spreadRadius: 1,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => const ExpandedPlayerDialog(),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              // Cover Art with Spin Indicator
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  track.coverUrl,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 44,
                    height: 44,
                    color: AppTheme.surfaceLight,
                    child: const Icon(Icons.music_note, color: AppTheme.primary),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Title & Artist
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      track.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      track.artistName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              // Play / Pause Button
              IconButton(
                icon: Icon(
                  audio.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
                  color: AppTheme.primaryLight,
                  size: 36,
                ),
                onPressed: () {
                  audio.togglePlayPause();
                },
              ),

              // Next Track
              IconButton(
                icon: const Icon(Icons.skip_next, color: AppTheme.textSecondary),
                onPressed: () {
                  audio.playNext();
                },
              ),
            ],
          ),
        ),
      ),
    ).animate().slideY(begin: 1.0, end: 0.0, duration: 400.ms, curve: Curves.easeOutCubic).fadeIn();
  }
}
