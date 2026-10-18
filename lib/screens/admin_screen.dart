import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/movie.dart';
import '../models/artist.dart';
import '../models/track.dart';
import '../models/merch.dart';
import '../models/cart.dart';
import '../providers/auth_provider.dart';
import '../providers/movies_provider.dart';
import '../providers/artists_provider.dart';
import '../providers/merch_provider.dart';
import '../providers/audio_provider.dart';
import '../providers/admin_provider.dart';
import '../theme/app_theme.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 7, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    // STRICT SECURITY GUARD: Access restricted to authenticated Administrators
    if (!auth.isAuthenticated || !auth.isAdmin) {
      return Scaffold(
        appBar: AppBar(title: const Text('ACCÈS SÉCURISÉ')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.gpp_bad_rounded, size: 80, color: AppTheme.error),
                const SizedBox(height: 16),
                const Text(
                  'Accès Refusé (403)',
                  style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Vous n\'avez pas les privilèges administrateur suffisants pour accéder à cet espace.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('RETOURNER À L\'ACCUEIL'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('PANNEAU DE CONTRÔLE ADMIN 416'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppTheme.secondary,
          labelColor: AppTheme.secondary,
          unselectedLabelColor: AppTheme.textMuted,
          tabs: const [
            Tab(icon: Icon(Icons.dashboard), text: 'Vue d\'ensemble'),
            Tab(icon: Icon(Icons.movie), text: 'Films & Séries'),
            Tab(icon: Icon(Icons.person), text: 'Roster Artistes'),
            Tab(icon: Icon(Icons.music_note), text: 'Audio & Beats'),
            Tab(icon: Icon(Icons.checkroom), text: 'Boutique Merch'),
            Tab(icon: Icon(Icons.card_membership), text: 'Membres & Pass'),
            Tab(icon: Icon(Icons.shopping_cart), text: 'Commandes'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _OverviewTab(),
          _MoviesAdminTab(),
          _ArtistsAdminTab(),
          _TracksAdminTab(),
          _MerchAdminTab(),
          _UsersSubscriptionsTab(),
          _OrdersAdminTab(),
        ],
      ),
    );
  }
}

// --- HELPER COMPONENT: Image Source Picker & Live Preview ---
class ImagePickerField extends StatefulWidget {
  final String initialUrl;
  final String label;
  final Function(String) onUrlChanged;

  const ImagePickerField({
    super.key,
    required this.initialUrl,
    required this.label,
    required this.onUrlChanged,
  });

  @override
  State<ImagePickerField> createState() => _ImagePickerFieldState();
}

class _ImagePickerFieldState extends State<ImagePickerField> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialUrl);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 6),
        Row(
          children: [
            // Preview Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 48,
                height: 48,
                color: AppTheme.surfaceLight,
                child: _controller.text.isNotEmpty
                    ? Image.network(
                        _controller.text,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, color: AppTheme.textMuted, size: 20),
                      )
                    : const Icon(Icons.image, color: AppTheme.textMuted, size: 20),
              ),
            ),
            const SizedBox(width: 10),

            // Input field
            Expanded(
              child: TextFormField(
                controller: _controller,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Coller l\'URL de l\'image (http://...)',
                  isDense: true,
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.add_photo_alternate, color: AppTheme.primaryLight, size: 20),
                    tooltip: 'Changer d\'image',
                    onPressed: () {
                      _showSampleImagePicker(context);
                    },
                  ),
                ),
                onChanged: (val) {
                  setState(() {});
                  widget.onUrlChanged(val.trim());
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _showSampleImagePicker(BuildContext context) {
    final sampleImages = [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600',
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Sélectionner une Image Modèle 416', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            SizedBox(
              height: 100,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: sampleImages.length,
                itemBuilder: (context, index) {
                  final img = sampleImages[index];
                  return Container(
                    margin: const EdgeInsets.only(right: 10),
                    child: InkWell(
                      onTap: () {
                        _controller.text = img;
                        widget.onUrlChanged(img);
                        setState(() {});
                        Navigator.pop(ctx);
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(img, width: 80, height: 100, fit: BoxFit.cover),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// 1. OVERVIEW DASHBOARD
class _OverviewTab extends StatelessWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context) {
    final adminProv = Provider.of<AdminProvider>(context);
    final moviesProv = Provider.of<MoviesProvider>(context);
    final artistsProv = Provider.of<ArtistsProvider>(context);
    final audioProv = Provider.of<AudioProvider>(context);
    final merchProv = Provider.of<MerchProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Statistiques & Données Réelles 416 Records',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 14),

          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _kpiCard('Membres Total', '${adminProv.totalUsers}', Icons.people, AppTheme.accent),
              _kpiCard('Abonnés Premium', '${adminProv.premiumUsersCount}', Icons.star, Colors.amber),
              _kpiCard('Films & Médias', '${moviesProv.movies.length}', Icons.movie, AppTheme.primary),
              _kpiCard('Roster Artistes', '${artistsProv.artists.length}', Icons.person, AppTheme.secondary),
              _kpiCard('Tracks Audio', '${audioProv.allTracks.length}', Icons.music_note, AppTheme.primaryLight),
              _kpiCard('Boutique Merch', '${merchProv.items.length}', Icons.checkroom, AppTheme.success),
              _kpiCard('Commandes', '${adminProv.orders.length}', Icons.shopping_bag, AppTheme.warning),
            ],
          ),
        ],
      ),
    );
  }

  Widget _kpiCard(String title, String value, IconData icon, Color color) {
    return Container(
      width: 155,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          Text(title, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
        ],
      ),
    );
  }
}

// 2. FILMS & SERIES ADMIN
class _MoviesAdminTab extends StatelessWidget {
  const _MoviesAdminTab();

  @override
  Widget build(BuildContext context) {
    final moviesProv = Provider.of<MoviesProvider>(context);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('AJOUTER UN FILM'),
        onPressed: () => _showMovieDialog(context),
      ),
      body: moviesProv.movies.isEmpty
          ? const Center(child: Text('Aucun film en base de données.', style: TextStyle(color: AppTheme.textMuted)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: moviesProv.movies.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final movie = moviesProv.movies[index];
                return Card(
                  color: AppTheme.surface,
                  child: ListTile(
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.network(
                        movie.posterUrl,
                        width: 40,
                        height: 50,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: AppTheme.surfaceLight, width: 40, height: 50),
                      ),
                    ),
                    title: Text(movie.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text('${movie.category} • ${movie.releaseYear} • ⭐ ${movie.rating}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit, color: AppTheme.primaryLight, size: 20),
                          onPressed: () => _showMovieDialog(context, movie: movie),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: AppTheme.error, size: 20),
                          onPressed: () {
                            moviesProv.deleteMovie(movie.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Film "${movie.title}" supprimé avec succès.')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showMovieDialog(BuildContext context, {Movie? movie}) {
    final isEdit = movie != null;
    final titleCtrl = TextEditingController(text: movie?.title ?? '');
    final subtitleCtrl = TextEditingController(text: movie?.subtitle ?? '');
    final descCtrl = TextEditingController(text: movie?.description ?? '');
    final categoryCtrl = TextEditingController(text: movie?.category ?? 'Films');
    final yearCtrl = TextEditingController(text: (movie?.releaseYear ?? 2026).toString());
    final durationCtrl = TextEditingController(text: (movie?.durationMinutes ?? 90).toString());
    final ratingCtrl = TextEditingController(text: (movie?.rating ?? 4.8).toString());
    String posterUrl = movie?.posterUrl ?? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800';
    String bannerUrl = movie?.bannerUrl ?? 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600';
    String videoUrl = movie?.videoUrl ?? 'https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-cheering-under-lights-42540-large.mp4';
    bool isFeatured = movie?.isFeatured ?? false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            backgroundColor: AppTheme.surface,
            title: Text(isEdit ? 'Éditer le Film' : 'Ajouter un Film / Vidéo', style: const TextStyle(color: Colors.white, fontSize: 16)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Titre')),
                  const SizedBox(height: 10),
                  TextFormField(controller: subtitleCtrl, decoration: const InputDecoration(labelText: 'Sous-titre')),
                  const SizedBox(height: 10),
                  TextFormField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Catégorie (Films, Documentaires, Clips, Séries)')),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: TextFormField(controller: yearCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Année'))),
                      const SizedBox(width: 8),
                      Expanded(child: TextFormField(controller: durationCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Durée (min)'))),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ImagePickerField(initialUrl: posterUrl, label: 'Affiche Poster URL / Image', onUrlChanged: (url) => posterUrl = url),
                  const SizedBox(height: 10),
                  ImagePickerField(initialUrl: bannerUrl, label: 'Bannière Grand Format', onUrlChanged: (url) => bannerUrl = url),
                  const SizedBox(height: 10),
                  TextFormField(controller: descCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Synopsis / Description')),
                  const SizedBox(height: 10),
                  SwitchListTile(
                    title: const Text('Mettre en vedette (Hero Banner)', style: TextStyle(color: Colors.white, fontSize: 13)),
                    value: isFeatured,
                    onChanged: (val) => setState(() => isFeatured = val),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
              ElevatedButton(
                onPressed: () {
                  if (titleCtrl.text.isNotEmpty) {
                    final newMovie = Movie(
                      id: isEdit ? movie.id : DateTime.now().millisecondsSinceEpoch.toString(),
                      title: titleCtrl.text,
                      subtitle: subtitleCtrl.text,
                      description: descCtrl.text,
                      posterUrl: posterUrl,
                      bannerUrl: bannerUrl,
                      videoUrl: videoUrl,
                      category: categoryCtrl.text,
                      durationMinutes: int.tryParse(durationCtrl.text) ?? 90,
                      releaseYear: int.tryParse(yearCtrl.text) ?? 2026,
                      rating: double.tryParse(ratingCtrl.text) ?? 4.8,
                      tags: ['416'],
                      cast: [],
                      isFeatured: isFeatured,
                    );

                    final prov = Provider.of<MoviesProvider>(context, listen: false);
                    if (isEdit) {
                      prov.updateMovie(newMovie);
                    } else {
                      prov.addMovie(newMovie);
                    }
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Film "${newMovie.title}" enregistré avec succès !')),
                    );
                  }
                },
                child: Text(isEdit ? 'Enregistrer' : 'Ajouter'),
              ),
            ],
          );
        },
      ),
    );
  }
}

// 3. ROSTER ARTISTES ADMIN
class _ArtistsAdminTab extends StatelessWidget {
  const _ArtistsAdminTab();

  @override
  Widget build(BuildContext context) {
    final artistsProv = Provider.of<ArtistsProvider>(context);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.secondary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('AJOUTER UN ARTISTE'),
        onPressed: () => _showArtistDialog(context),
      ),
      body: artistsProv.artists.isEmpty
          ? const Center(child: Text('Aucun artiste enregistré.', style: TextStyle(color: AppTheme.textMuted)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: artistsProv.artists.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final artist = artistsProv.artists[index];
                return Card(
                  color: AppTheme.surface,
                  child: ListTile(
                    leading: CircleAvatar(backgroundImage: NetworkImage(artist.avatarUrl)),
                    title: Text(artist.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text(artist.role, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit, color: AppTheme.primaryLight, size: 20),
                          onPressed: () => _showArtistDialog(context, artist: artist),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: AppTheme.error, size: 20),
                          onPressed: () {
                            artistsProv.deleteArtist(artist.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Artiste "${artist.name}" supprimé.')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showArtistDialog(BuildContext context, {Artist? artist}) {
    final isEdit = artist != null;
    final nameCtrl = TextEditingController(text: artist?.name ?? '');
    final realNameCtrl = TextEditingController(text: artist?.realName ?? '');
    final roleCtrl = TextEditingController(text: artist?.role ?? 'Rappeur & Producteur');
    final bioCtrl = TextEditingController(text: artist?.bio ?? '');
    String avatarUrl = artist?.avatarUrl ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';
    String bannerUrl = artist?.bannerUrl ?? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text(isEdit ? 'Éditer l\'Artiste' : 'Ajouter un Artiste Roster', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom de Scène')),
              const SizedBox(height: 10),
              TextFormField(controller: realNameCtrl, decoration: const InputDecoration(labelText: 'Nom Réel')),
              const SizedBox(height: 10),
              TextFormField(controller: roleCtrl, decoration: const InputDecoration(labelText: 'Rôle (Rappeur, Beatmaker, Réalisateur)')),
              const SizedBox(height: 10),
              ImagePickerField(initialUrl: avatarUrl, label: 'Photo Profil Avatar', onUrlChanged: (url) => avatarUrl = url),
              const SizedBox(height: 10),
              ImagePickerField(initialUrl: bannerUrl, label: 'Photo Couverture Bannière', onUrlChanged: (url) => bannerUrl = url),
              const SizedBox(height: 10),
              TextFormField(controller: bioCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Biographie')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.isNotEmpty) {
                final newArtist = Artist(
                  id: isEdit ? artist.id : DateTime.now().millisecondsSinceEpoch.toString(),
                  name: nameCtrl.text,
                  realName: realNameCtrl.text,
                  role: roleCtrl.text,
                  bio: bioCtrl.text,
                  avatarUrl: avatarUrl,
                  bannerUrl: bannerUrl,
                );

                final prov = Provider.of<ArtistsProvider>(context, listen: false);
                if (isEdit) {
                  prov.updateArtist(newArtist);
                } else {
                  prov.addArtist(newArtist);
                }
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Artiste "${newArtist.name}" enregistré avec succès !')),
                );
              }
            },
            child: Text(isEdit ? 'Enregistrer' : 'Ajouter'),
          ),
        ],
      ),
    );
  }
}

// 4. TRACKS & BEATS ADMIN
class _TracksAdminTab extends StatelessWidget {
  const _TracksAdminTab();

  @override
  Widget build(BuildContext context) {
    final audioProv = Provider.of<AudioProvider>(context);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primaryLight,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('AJOUTER UN MORCEAU'),
        onPressed: () => _showTrackDialog(context),
      ),
      body: audioProv.allTracks.isEmpty
          ? const Center(child: Text('Aucun morceau audio enregistré.', style: TextStyle(color: AppTheme.textMuted)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: audioProv.allTracks.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final track = audioProv.allTracks[index];
                return Card(
                  color: AppTheme.surface,
                  child: ListTile(
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.network(track.coverUrl, width: 40, height: 40, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: AppTheme.surfaceLight, width: 40, height: 40)),
                    ),
                    title: Text(track.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text('${track.artistName} • ${track.album}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.play_circle_fill, color: AppTheme.primaryLight, size: 24),
                          onPressed: () => audioProv.playTrack(track, playlist: audioProv.allTracks),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: AppTheme.error, size: 20),
                          onPressed: () {
                            audioProv.deleteTrack(track.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Morceau "${track.title}" supprimé.')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showTrackDialog(BuildContext context, {Track? track}) {
    final isEdit = track != null;
    final titleCtrl = TextEditingController(text: track?.title ?? '');
    final artistNameCtrl = TextEditingController(text: track?.artistName ?? '416 All Stars');
    final albumCtrl = TextEditingController(text: track?.album ?? 'Single 416');
    final genreCtrl = TextEditingController(text: track?.genre ?? 'Trap / Rap FR');
    String coverUrl = track?.coverUrl ?? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600';
    String audioUrl = track?.audioUrl ?? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text(isEdit ? 'Éditer le Morceau' : 'Ajouter un Morceau / Beat', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Titre du Morceau')),
              const SizedBox(height: 10),
              TextFormField(controller: artistNameCtrl, decoration: const InputDecoration(labelText: 'Nom de l\'Artiste')),
              const SizedBox(height: 10),
              TextFormField(controller: albumCtrl, decoration: const InputDecoration(labelText: 'Album / Projet')),
              const SizedBox(height: 10),
              TextFormField(controller: genreCtrl, decoration: const InputDecoration(labelText: 'Genre (Trap, Drill, Rap FR)')),
              const SizedBox(height: 10),
              ImagePickerField(initialUrl: coverUrl, label: 'Image Pochette Artwork', onUrlChanged: (url) => coverUrl = url),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () {
              if (titleCtrl.text.isNotEmpty) {
                final newTrack = Track(
                  id: isEdit ? track.id : DateTime.now().millisecondsSinceEpoch.toString(),
                  title: titleCtrl.text,
                  artistName: artistNameCtrl.text,
                  artistId: 'a1',
                  album: albumCtrl.text,
                  audioUrl: audioUrl,
                  coverUrl: coverUrl,
                  durationSeconds: 210,
                  genre: genreCtrl.text,
                );

                final prov = Provider.of<AudioProvider>(context, listen: false);
                if (isEdit) {
                  prov.updateTrack(newTrack);
                } else {
                  prov.addTrack(newTrack);
                }
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Morceau "${newTrack.title}" enregistré avec succès !')),
                );
              }
            },
            child: Text(isEdit ? 'Enregistrer' : 'Ajouter'),
          ),
        ],
      ),
    );
  }
}

// 5. BOUTIQUE MERCH ADMIN
class _MerchAdminTab extends StatelessWidget {
  const _MerchAdminTab();

  @override
  Widget build(BuildContext context) {
    final merchProv = Provider.of<MerchProvider>(context);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.success,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('AJOUTER UN ARTICLE'),
        onPressed: () => _showMerchDialog(context),
      ),
      body: merchProv.items.isEmpty
          ? const Center(child: Text('Aucun article en boutique.', style: TextStyle(color: AppTheme.textMuted)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: merchProv.items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = merchProv.items[index];
                return Card(
                  color: AppTheme.surface,
                  child: ListTile(
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.network(item.imageUrl, width: 40, height: 40, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: AppTheme.surfaceLight, width: 40, height: 40)),
                    ),
                    title: Text(item.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text('${item.price.toStringAsFixed(2)} € • ${item.category}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit, color: AppTheme.primaryLight, size: 20),
                          onPressed: () => _showMerchDialog(context, item: item),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: AppTheme.error, size: 20),
                          onPressed: () {
                            merchProv.deleteMerch(item.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Article "${item.name}" supprimé.')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showMerchDialog(BuildContext context, {MerchItem? item}) {
    final isEdit = item != null;
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final priceCtrl = TextEditingController(text: (item?.price ?? 39.99).toString());
    final categoryCtrl = TextEditingController(text: item?.category ?? 'T-Shirts');
    final descCtrl = TextEditingController(text: item?.description ?? '');
    String imageUrl = item?.imageUrl ?? 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text(isEdit ? 'Éditer l\'Article' : 'Ajouter un Article Merch', style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom du Produit')),
              const SizedBox(height: 10),
              TextFormField(controller: priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Prix (€)')),
              const SizedBox(height: 10),
              TextFormField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Catégorie (T-Shirts, Hoodies, Vinyles)')),
              const SizedBox(height: 10),
              ImagePickerField(initialUrl: imageUrl, label: 'Photo Produit URL / Image', onUrlChanged: (url) => imageUrl = url),
              const SizedBox(height: 10),
              TextFormField(controller: descCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Description')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.isNotEmpty) {
                final newItem = MerchItem(
                  id: isEdit ? item.id : DateTime.now().millisecondsSinceEpoch.toString(),
                  name: nameCtrl.text,
                  price: double.tryParse(priceCtrl.text) ?? 39.99,
                  description: descCtrl.text,
                  imageUrl: imageUrl,
                  category: categoryCtrl.text,
                  availableSizes: ['S', 'M', 'L', 'XL'],
                );

                final prov = Provider.of<MerchProvider>(context, listen: false);
                if (isEdit) {
                  prov.updateMerch(newItem);
                } else {
                  prov.addMerch(newItem);
                }
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Article "${newItem.name}" enregistré avec succès !')),
                );
              }
            },
            child: Text(isEdit ? 'Enregistrer' : 'Ajouter'),
          ),
        ],
      ),
    );
  }
}

// 6. ABONNÉS FREE & PREMIUM
class _UsersSubscriptionsTab extends StatelessWidget {
  const _UsersSubscriptionsTab();

  @override
  Widget build(BuildContext context) {
    final adminProv = Provider.of<AdminProvider>(context);

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: adminProv.users.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final user = adminProv.users[index];
        final isPremium = user.isPremium;

        return Card(
          color: AppTheme.surface,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: NetworkImage(
                    user.avatarUrl.isNotEmpty
                        ? user.avatarUrl
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.fullName.isNotEmpty ? user.fullName : user.username,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        user.email,
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    adminProv.toggleUserPremiumStatus(user.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Abonnement de ${user.username} mis à jour !')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isPremium ? AppTheme.surfaceBorder : AppTheme.secondary,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  ),
                  child: Text(
                    isPremium ? 'Free' : 'Premium VIP',
                    style: const TextStyle(fontSize: 10),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// 7. COMMANDES MERCH
class _OrdersAdminTab extends StatelessWidget {
  const _OrdersAdminTab();

  @override
  Widget build(BuildContext context) {
    final adminProv = Provider.of<AdminProvider>(context);

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: adminProv.orders.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final order = adminProv.orders[index];
        return Card(
          color: AppTheme.surface,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Commande #${order.id}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    Text('${order.totalAmount.toStringAsFixed(2)} €', style: const TextStyle(color: AppTheme.primaryLight, fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 6),
                Text('Client: ${order.customerName} (${order.customerPhone})', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                Text('Adresse: ${order.customerAddress}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Text('Statut: ', style: TextStyle(color: Colors.white, fontSize: 12)),
                    DropdownButton<String>(
                      value: order.status,
                      dropdownColor: AppTheme.surface,
                      style: const TextStyle(color: AppTheme.primaryLight, fontWeight: FontWeight.bold, fontSize: 12),
                      items: const [
                        DropdownMenuItem(value: 'Pending', child: Text('En attente')),
                        DropdownMenuItem(value: 'Confirmed', child: Text('Confirmée')),
                        DropdownMenuItem(value: 'Shipped', child: Text('Expédiée')),
                        DropdownMenuItem(value: 'Delivered', child: Text('Livrée')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          adminProv.updateOrderStatus(order.id, val);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Statut de la commande #${order.id} mis à jour : $val')),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
