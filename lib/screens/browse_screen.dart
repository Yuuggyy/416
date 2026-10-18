import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/movies_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/movie_card.dart';

class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final moviesProv = Provider.of<MoviesProvider>(context);
    final categories = ['Tous', 'Films', 'Documentaires', 'Clips', 'Séries'];
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Scaffold(
      appBar: AppBar(
        title: const Text('CATALOGUE FILMS & MEDIAS'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(46),
          child: SizedBox(
            height: 36,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final cat = categories[index];
                final isSelected = moviesProv.selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(cat, style: TextStyle(fontSize: isMobile ? 11 : 13)),
                    selected: isSelected,
                    selectedColor: AppTheme.primary,
                    backgroundColor: AppTheme.surface,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppTheme.textSecondary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    onSelected: (_) {
                      moviesProv.setCategory(cat);
                    },
                  ),
                );
              },
            ),
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: moviesProv.filteredMovies.isEmpty
            ? const Center(
                child: Text(
                  'Aucun film trouvé dans cette catégorie.',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
              )
            : GridView.builder(
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: isMobile ? 2 : (screenWidth ~/ 160).clamp(2, 6),
                  childAspectRatio: 0.65,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 12,
                ),
                itemCount: moviesProv.filteredMovies.length,
                itemBuilder: (context, index) {
                  return MovieCard(
                    movie: moviesProv.filteredMovies[index],
                    width: double.infinity,
                  );
                },
              ),
      ),
    );
  }
}
