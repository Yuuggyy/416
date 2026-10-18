import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../theme/app_theme.dart';

class VideoPlayerWidget extends StatefulWidget {
  final Movie movie;

  const VideoPlayerWidget({super.key, required this.movie});

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  bool _isPlaying = true;
  double _currentPosition = 15.0; // Simulated playback seconds
  String _selectedQuality = '1080p HD';
  bool _isDownloading = false;
  bool _isDownloaded = false;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Container(
        color: Colors.black,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Video Backdrop simulation with movie banner
            Image.network(
              widget.movie.bannerUrl,
              width: double.infinity,
              height: double.infinity,
              fit: BoxFit.cover,
            ),

            // Dark overlay
            Container(color: Colors.black.withOpacity(0.4)),

            // Center Play/Pause button
            IconButton(
              iconSize: 60,
              icon: Icon(
                _isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
                color: Colors.white.withOpacity(0.9),
              ),
              onPressed: () {
                setState(() {
                  _isPlaying = !_isPlaying;
                });
              },
            ),

            // Top Video Bar: Back, Quality Selector, Offline Download
            Positioned(
              top: 8,
              left: 12,
              right: 12,
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.movie.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${widget.movie.category} • $_selectedQuality',
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Quality Selector Menu
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.settings, color: Colors.white, size: 20),
                    color: AppTheme.surface,
                    onSelected: (val) {
                      setState(() {
                        _selectedQuality = val;
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Qualité vidéo changée à $_selectedQuality')),
                      );
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(value: '1080p HD', child: Text('1080p Full HD (60fps)', style: TextStyle(color: Colors.white, fontSize: 13))),
                      const PopupMenuItem(value: '720p HD', child: Text('720p HD', style: TextStyle(color: Colors.white, fontSize: 13))),
                      const PopupMenuItem(value: '480p SD', child: Text('480p Économie de données', style: TextStyle(color: Colors.white, fontSize: 13))),
                    ],
                  ),

                  // Offline Download Button
                  IconButton(
                    icon: _isDownloading
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryLight))
                        : Icon(
                            _isDownloaded ? Icons.download_done : Icons.download_for_offline_outlined,
                            color: _isDownloaded ? AppTheme.success : Colors.white,
                            size: 22,
                          ),
                    onPressed: _isDownloading || _isDownloaded
                        ? null
                        : () async {
                            setState(() {
                              _isDownloading = true;
                            });
                            await Future.delayed(const Duration(seconds: 2));
                            setState(() {
                              _isDownloading = false;
                              _isDownloaded = true;
                            });
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('${widget.movie.title} téléchargé pour visionnage hors-ligne !')),
                              );
                            }
                          },
                  ),
                ],
              ),
            ),

            // Bottom Player Slider Controls
            Positioned(
              bottom: 8,
              left: 12,
              right: 12,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: AppTheme.primaryLight,
                      inactiveTrackColor: Colors.white24,
                      thumbColor: AppTheme.primaryLight,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5),
                      trackHeight: 3,
                    ),
                    child: Slider(
                      value: _currentPosition,
                      max: widget.movie.durationMinutes * 60.0,
                      onChanged: (val) {
                        setState(() {
                          _currentPosition = val;
                        });
                      },
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _formatSeconds(_currentPosition.toInt()),
                        style: const TextStyle(color: Colors.white, fontSize: 10),
                      ),
                      Text(
                        '${widget.movie.durationMinutes}:00',
                        style: const TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatSeconds(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }
}
