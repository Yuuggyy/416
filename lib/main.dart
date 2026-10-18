import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Providers
import 'providers/auth_provider.dart';
import 'providers/movies_provider.dart';
import 'providers/artists_provider.dart';
import 'providers/merch_provider.dart';
import 'providers/watchlist_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/audio_provider.dart';
import 'providers/admin_provider.dart';

// Theme
import 'theme/app_theme.dart';

// Screens
import 'screens/home_screen.dart';
import 'screens/browse_screen.dart';
import 'screens/artists_screen.dart';
import 'screens/merch_screen.dart';
import 'screens/watchlist_screen.dart';

// Widgets
import 'widgets/app_navbar.dart';
import 'widgets/mini_player.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const Quatro416App());
}

class Quatro416App extends StatelessWidget {
  const Quatro416App({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => MoviesProvider()),
        ChangeNotifierProvider(create: (_) => ArtistsProvider()),
        ChangeNotifierProvider(create: (_) => MerchProvider()),
        ChangeNotifierProvider(create: (_) => WatchlistProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => AudioProvider()),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
      ],
      child: MaterialApp(
        title: '416 RECORDS',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const MainNavigationScaffold(),
      ),
    );
  }
}

class MainNavigationScaffold extends StatefulWidget {
  const MainNavigationScaffold({super.key});

  @override
  State<MainNavigationScaffold> createState() => _MainNavigationScaffoldState();
}

class _MainNavigationScaffoldState extends State<MainNavigationScaffold> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    BrowseScreen(),
    ArtistsScreen(),
    MerchScreen(),
    WatchlistScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppNavbar(
        activeIndex: _currentIndex,
        onTabSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
      body: Stack(
        children: [
          // Current Screen View
          IndexedStack(
            index: _currentIndex,
            children: _screens,
          ),

          // Floating Persistent Mini Music Player
          const Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: MiniPlayer(),
          ),
        ],
      ),
      bottomNavigationBar: MediaQuery.of(context).size.width <= 700
          ? BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home),
                  label: 'Accueil',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.movie_outlined),
                  label: 'Films',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.group_outlined),
                  label: 'Artistes',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.shopping_bag_outlined),
                  label: 'Boutique',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.bookmark_outline),
                  label: 'Ma Liste',
                ),
              ],
            )
          : null,
    );
  }
}
