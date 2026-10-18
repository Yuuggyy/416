import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/movies_provider.dart';
import '../providers/artists_provider.dart';
import '../providers/merch_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/movie_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final moviesProv = Provider.of<MoviesProvider>(context);
    final artistsProv = Provider.of<ArtistsProvider>(context);
    final merchProv = Provider.of<MerchProvider>(context);

    final matchingMovies = moviesProv.movies.where((m) {
      final q = _query.toLowerCase();
      return m.title.toLowerCase().contains(q) || m.description.toLowerCase().contains(q) || m.tags.any((t) => t.toLowerCase().contains(q));
    }).toList();

    final matchingArtists = artistsProv.artists.where((a) {
      final q = _query.toLowerCase();
      return a.name.toLowerCase().contains(q) || a.role.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Rechercher films, artistes, prods, merch...',
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            fillColor: Colors.transparent,
          ),
          onChanged: (val) {
            setState(() {
              _query = val.trim();
            });
          },
        ),
        actions: [
          if (_query.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () {
                _searchController.clear();
                setState(() {
                  _query = '';
                });
              },
            ),
        ],
      ),
      body: _query.isEmpty
          ? const Center(
              child: Text(
                'Entrez un nom de film, artiste ou morceau pour commencer...',
                style: TextStyle(color: AppTheme.textMuted),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (matchingMovies.isNotEmpty) ...[
                    Text(
                      'FILMS & MEDIA (${matchingMovies.length})',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 250,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: matchingMovies.length,
                        itemBuilder: (context, index) {
                          return MovieCard(movie: matchingMovies[index]);
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (matchingArtists.isNotEmpty) ...[
                    Text(
                      'ARTISTES (${matchingArtists.length})',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...matchingArtists.map((a) {
                      return ListTile(
                        leading: CircleAvatar(backgroundImage: NetworkImage(a.avatarUrl)),
                        title: Text(a.name, style: const TextStyle(color: Colors.white)),
                        subtitle: Text(a.role, style: const TextStyle(color: AppTheme.textMuted)),
                      );
                    }),
                  ],
                ],
              ),
            ),
    );
  }
}
