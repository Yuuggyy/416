import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/merch.dart';
import '../models/cart.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalPrice => _items.fold(0.0, (sum, item) => sum + item.totalPrice);

  void addToCart(MerchItem merch, String size, {int quantity = 1}) {
    final index = _items.indexWhere(
      (element) => element.item.id == merch.id && element.selectedSize == size,
    );

    if (index >= 0) {
      _items[index].quantity += quantity;
    } else {
      _items.add(CartItem(
        item: merch,
        selectedSize: size,
        quantity: quantity,
      ));
    }
    notifyListeners();
  }

  void removeFromCart(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      notifyListeners();
    }
  }

  void updateQuantity(int index, int delta) {
    if (index >= 0 && index < _items.length) {
      _items[index].quantity += delta;
      if (_items[index].quantity <= 0) {
        _items.removeAt(index);
      }
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }

  Future<void> checkoutWhatsApp({required String name, required String phone, required String address}) async {
    final buffer = StringBuffer();
    buffer.writeln('🔥 *NOUVELLE COMMANDE 416 RECORDS* 🔥\n');
    buffer.writeln('👤 *Client:* $name');
    buffer.writeln('📞 *Tél:* $phone');
    buffer.writeln('📍 *Adresse:* $address\n');
    buffer.writeln('🛍️ *Articles:*');

    for (var i in _items) {
      buffer.writeln('- ${i.item.name} (${i.selectedSize}) x${i.quantity} = ${i.totalPrice.toStringAsFixed(2)} €');
    }

    buffer.writeln('\n💰 *TOTAL:* ${totalPrice.toStringAsFixed(2)} €');
    buffer.writeln('\nMerci de confirmer ma commande ! 🚀');

    final message = Uri.encodeComponent(buffer.toString());
    final whatsappUrl = Uri.parse('https://wa.me/33600000000?text=$message');

    if (await canLaunchUrl(whatsappUrl)) {
      await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
    }
  }
}
