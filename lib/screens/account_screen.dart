import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/watchlist_provider.dart';
import '../services/django_api_service.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'admin_screen.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final watchlist = Provider.of<WatchlistProvider>(context);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('MON COMPTE')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.account_circle, size: 80, color: AppTheme.textMuted),
              const SizedBox(height: 16),
              const Text(
                'Connectez-vous pour accéder à votre profil',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                },
                child: const Text('SE CONNECTER'),
              ),
            ],
          ),
        ),
      );
    }

    final user = auth.currentUser!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('PROFIL MEMBRE 416'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.error),
            onPressed: () {
              auth.logout();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // User Profile Card with 1-Tap Avatar Photo Upload
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundImage: NetworkImage(
                          user.avatarUrl.isNotEmpty
                              ? user.avatarUrl
                              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
                        ),
                      ),
                      InkWell(
                        onTap: () async {
                          final picker = ImagePicker();
                          final image = await picker.pickImage(source: ImageSource.gallery);
                          if (image != null) {
                            final bytes = await image.readAsBytes();
                            final uploadedUrl = await DjangoApiService.uploadFileBytes(bytes, image.name);
                            if (uploadedUrl != null) {
                              auth.updateProfile(avatarUrl: uploadedUrl);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Photo de profil mise à jour avec succès !')),
                                );
                              }
                            }
                          }
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.fullName.isNotEmpty ? user.fullName : user.username,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          user.email,
                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: user.isAdmin ? AppTheme.secondary : (user.isPremium ? Colors.amber : AppTheme.primary),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            user.isAdmin
                                ? 'ADMINISTRATEUR 416'
                                : (user.isPremium ? 'MEMBRE PREMIUM VIP 416' : 'MEMBRE GRATUIT 416'),
                            style: TextStyle(
                              color: user.isPremium ? Colors.black : Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Admin Portal Shortcut if Admin
            if (user.isAdmin) ...[
              Card(
                color: AppTheme.secondary.withOpacity(0.15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: AppTheme.secondary),
                ),
                child: ListTile(
                  leading: const Icon(Icons.admin_panel_settings, color: AppTheme.secondary, size: 30),
                  title: const Text(
                    'TABLEAU DE BORD ADMIN 416',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  subtitle: const Text(
                    'Gérer films, artistes, tracks audio, merch & serveur central',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, color: AppTheme.secondary, size: 16),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AdminScreen()),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Stats
            Row(
              children: [
                Expanded(
                  child: _statCard('Ma Liste Films', '${watchlist.savedMovieIds.length} enregistrés', Icons.movie),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _statCard('Tracks Aimés', '${watchlist.likedTrackIds.length} morceaux', Icons.favorite),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.surfaceBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppTheme.primaryLight),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
        ],
      ),
    );
  }
}
