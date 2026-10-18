import 'package:flutter/material.dart';
import '../models/merch.dart';
import '../services/django_api_service.dart';

class MerchProvider extends ChangeNotifier {
  List<MerchItem> _items = [];
  bool _isLoading = false;
  String _selectedCategory = 'Tous';

  List<MerchItem> get items => _items;
  bool get isLoading => _isLoading;
  String get selectedCategory => _selectedCategory;

  List<MerchItem> get filteredItems {
    if (_selectedCategory == 'Tous') return _items;
    return _items.where((i) => i.category == _selectedCategory).toList();
  }

  MerchProvider() {
    loadMerch();
  }

  Future<void> loadMerch() async {
    _isLoading = true;
    notifyListeners();
    _items = await DjangoApiService.getMerch();
    _isLoading = false;
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> addMerch(MerchItem item) async {
    _items.insert(0, item);
    notifyListeners();
    await DjangoApiService.createMerch(item);
  }

  Future<void> updateMerch(MerchItem item) async {
    final index = _items.indexWhere((i) => i.id == item.id);
    if (index >= 0) {
      _items[index] = item;
      notifyListeners();
      await DjangoApiService.updateMerch(item);
    }
  }

  Future<void> deleteMerch(String id) async {
    _items.removeWhere((i) => i.id == id);
    notifyListeners();
    await DjangoApiService.deleteMerch(id);
  }
}
