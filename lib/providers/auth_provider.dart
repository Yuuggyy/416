import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/django_api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isAdmin => _currentUser?.isAdmin ?? false;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    // Auto-login default demo user for frictionless experience
    _currentUser = User(
      id: '1',
      email: 'admin@416records.fr',
      username: 'Admin416',
      fullName: 'Administrateur 416',
      role: 'admin',
      token: 'demo_token_416',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
    );
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await DjangoApiService.login(email, password);
      if (user != null) {
        _currentUser = user;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = 'Identifiants incorrects';
      }
    } catch (e) {
      _errorMessage = 'Erreur de connexion au serveur Django';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }

  void updateProfile({String? fullName, String? avatarUrl}) {
    if (_currentUser != null) {
      _currentUser = _currentUser!.copyWith(
        fullName: fullName,
        avatarUrl: avatarUrl,
      );
      notifyListeners();
    }
  }
}
