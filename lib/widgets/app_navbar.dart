import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../screens/search_screen.dart';
import '../screens/account_screen.dart';
import '../screens/admin_screen.dart';
import '../widgets/cart_drawer.dart';
import 'logo_416.dart';

class AppNavbar extends StatelessWidget implements PreferredSizeWidget {
  final int activeIndex;
  final Function(int)? onTabSelected;

  const AppNavbar({
    super.key,
    this.activeIndex = 0,
    this.onTabSelected,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final cart = Provider.of<CartProvider>(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          height: 60,
          decoration: BoxDecoration(
            color: AppTheme.background.withOpacity(0.9),
            border: Border(
              bottom: BorderSide(color: AppTheme.primary.withOpacity(0.2), width: 1),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: SafeArea(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Logo - Responsive compact on narrow phones
                InkWell(
                  onTap: () {
                    if (onTabSelected != null) onTabSelected!(0);
                  },
                  child: Logo416Widget(
                    size: isMobile ? 30 : 36,
                    showText: screenWidth >= 480,
                  ),
                ),

                // Navigation Links (Desktop / Wide screen)
                if (screenWidth > 700)
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _navButton(context, 'Accueil', 0),
                        _navButton(context, 'Catalogue Films', 1),
                        _navButton(context, 'Artistes 416', 2),
                        _navButton(context, 'Boutique Merch', 3),
                        _navButton(context, 'Ma Liste', 4),
                        if (auth.isAdmin) _adminBadgeButton(context),
                      ],
                    ),
                  ),

                // Actions: Search, Cart, Profile/Admin
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Global Search Button
                    IconButton(
                      constraints: const BoxConstraints(),
                      padding: const EdgeInsets.all(6),
                      icon: const Icon(Icons.search, color: AppTheme.textPrimary, size: 20),
                      tooltip: 'Recherche',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SearchScreen()),
                        );
                      },
                    ),

                    // Cart Icon with Badge
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        IconButton(
                          constraints: const BoxConstraints(),
                          padding: const EdgeInsets.all(6),
                          icon: const Icon(Icons.shopping_bag_outlined, color: AppTheme.textPrimary, size: 20),
                          tooltip: 'Panier Merch',
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => const CartDrawer(),
                            );
                          },
                        ),
                        if (cart.itemCount > 0)
                          Positioned(
                            right: 2,
                            top: 2,
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: const BoxDecoration(
                                color: AppTheme.primary,
                                shape: BoxShape.circle,
                              ),
                              constraints: const BoxConstraints(
                                minWidth: 15,
                                minHeight: 15,
                              ),
                              child: Text(
                                '${cart.itemCount}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(width: 6),

                    // User Profile / Admin Avatar
                    InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AccountScreen()),
                        );
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: auth.isAdmin ? [AppTheme.secondary, Colors.amber] : [AppTheme.primary, AppTheme.accent],
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 14,
                          backgroundColor: AppTheme.surface,
                          backgroundImage: auth.currentUser?.avatarUrl.isNotEmpty == true
                              ? NetworkImage(auth.currentUser!.avatarUrl)
                              : null,
                          child: auth.currentUser?.avatarUrl.isEmpty != false
                              ? const Icon(Icons.person, size: 16, color: AppTheme.primaryLight)
                              : null,
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
    );
  }

  Widget _navButton(BuildContext context, String label, int index) {
    final isSelected = activeIndex == index;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: TextButton(
        onPressed: () {
          if (onTabSelected != null) onTabSelected!(index);
        },
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          backgroundColor: isSelected ? AppTheme.primary.withOpacity(0.18) : Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppTheme.primaryLight : AppTheme.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _adminBadgeButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AdminScreen()),
          );
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.secondary.withOpacity(0.2),
            border: Border.all(color: AppTheme.secondary, width: 1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.admin_panel_settings, size: 12, color: AppTheme.secondary),
              SizedBox(width: 4),
              Text(
                'ADMIN',
                style: TextStyle(
                  color: AppTheme.secondary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
