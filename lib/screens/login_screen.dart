import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/logo_416.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSignUp = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Logo416Widget(size: 56, showText: true),
                  const SizedBox(height: 28),

                  Text(
                    _isSignUp ? 'Créer un compte 416' : 'Connexion 416 Records',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Accédez aux exclusivités, films & catalogue officiel 416 Records',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                  const SizedBox(height: 24),

                  if (auth.errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.error.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.error),
                      ),
                      child: Text(
                        auth.errorMessage!,
                        style: const TextStyle(color: AppTheme.error, fontSize: 13),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Form inputs
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email ou nom d\'utilisateur',
                      prefixIcon: Icon(Icons.email_outlined, color: AppTheme.textMuted),
                    ),
                  ),
                  const SizedBox(height: 14),

                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Mot de passe',
                      prefixIcon: Icon(Icons.lock_outline, color: AppTheme.textMuted),
                    ),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: auth.isLoading
                          ? null
                          : () async {
                              final email = _emailController.text.trim().isNotEmpty
                                  ? _emailController.text.trim()
                                  : 'user@416records.fr';
                              final pass = _passwordController.text.trim().isNotEmpty
                                  ? _passwordController.text.trim()
                                  : 'password';
                              final success = await auth.login(email, pass);
                              if (success && mounted) {
                                Navigator.pop(context);
                              }
                            },
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 15)),
                      child: auth.isLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(_isSignUp ? 'S\'INSCRIRE' : 'SE CONNECTER'),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Divider
                  const Row(
                    children: [
                      Expanded(child: Divider(color: AppTheme.surfaceBorder)),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text('OU', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                      ),
                      Expanded(child: Divider(color: AppTheme.surfaceBorder)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Social Sign-In Buttons (Google & Apple)
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        await auth.login('google_user@416records.fr', 'google_auth');
                        if (mounted) Navigator.pop(context);
                      },
                      icon: const Icon(Icons.g_mobiledata, color: Colors.white, size: 24),
                      label: const Text('Continuer avec Google', style: TextStyle(color: Colors.white)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.surfaceBorder),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        await auth.login('apple_user@416records.fr', 'apple_auth');
                        if (mounted) Navigator.pop(context);
                      },
                      icon: const Icon(Icons.apple, color: Colors.white, size: 22),
                      label: const Text('Continuer avec Apple', style: TextStyle(color: Colors.white)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.surfaceBorder),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isSignUp = !_isSignUp;
                      });
                    },
                    child: Text(
                      _isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire',
                      style: const TextStyle(color: AppTheme.primaryLight),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
