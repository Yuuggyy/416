import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/cart.dart';
import '../services/django_api_service.dart';

class AdminProvider extends ChangeNotifier {
  List<User> _users = [];
  List<Order> _orders = [];
  bool _isLoading = false;

  String _appTitle = '416 RECORDS';
  String _announcementMessage = '🔥 Nouvel Album "416 ALL STARS" disponible en précommande & Streaming HD';
  bool _maintenanceMode = false;
  String _djangoBackendUrl = 'http://192.168.1.78:8000/api/';

  List<User> get users => _users;
  List<Order> get orders => _orders;
  bool get isLoading => _isLoading;

  String get appTitle => _appTitle;
  String get announcementMessage => _announcementMessage;
  bool get maintenanceMode => _maintenanceMode;
  String get djangoBackendUrl => _djangoBackendUrl;

  int get totalUsers => _users.length;
  int get premiumUsersCount => _users.where((u) => u.isPremium).length;
  int get freeUsersCount => _users.where((u) => !u.isPremium).length;

  AdminProvider() {
    loadAdminData();
  }

  Future<void> loadAdminData() async {
    _isLoading = true;
    notifyListeners();
    _users = await DjangoApiService.getAdminUsersList();
    _orders = await DjangoApiService.getOrders();
    _isLoading = false;
    notifyListeners();
  }

  Future<void> toggleUserPremiumStatus(String userId) async {
    final index = _users.indexWhere((u) => u.id == userId);
    if (index >= 0) {
      final current = _users[index];
      final newIsPremium = !current.isPremium;
      _users[index] = current.copyWith(
        isPremium: newIsPremium,
        subscriptionTier: newIsPremium ? 'vip_416' : 'free',
        subscriptionExpiry: newIsPremium ? '2027-12-31' : null,
      );
      notifyListeners();
      await DjangoApiService.toggleUserPremium(userId);
    }
  }

  Future<void> updateOrderStatus(String orderId, String newStatus) async {
    final index = _orders.indexWhere((o) => o.id == orderId);
    if (index >= 0) {
      final current = _orders[index];
      _orders[index] = Order(
        id: current.id,
        items: current.items,
        totalAmount: current.totalAmount,
        customerName: current.customerName,
        customerPhone: current.customerPhone,
        customerAddress: current.customerAddress,
        orderDate: current.orderDate,
        status: newStatus,
      );
      notifyListeners();
      await DjangoApiService.updateOrderStatus(orderId, newStatus);
    }
  }

  void updateSettings({
    String? title,
    String? announcement,
    bool? maintenance,
    String? backendUrl,
  }) {
    if (title != null) _appTitle = title;
    if (announcement != null) _announcementMessage = announcement;
    if (maintenance != null) _maintenanceMode = maintenance;
    if (backendUrl != null) _djangoBackendUrl = backendUrl;
    notifyListeners();
  }
}
