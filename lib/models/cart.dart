import 'merch.dart';

class CartItem {
  final MerchItem item;
  final String selectedSize;
  int quantity;

  CartItem({
    required this.item,
    required this.selectedSize,
    this.quantity = 1,
  });

  double get totalPrice => item.price * quantity;
}

class Order {
  final String id;
  final String orderNumber;
  final List<CartItem> items;
  final double totalAmount;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final String paymentMethod;
  final String paymentStatus;
  final DateTime orderDate;
  final String status; // 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'

  Order({
    required this.id,
    this.orderNumber = '',
    required this.items,
    required this.totalAmount,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    this.paymentMethod = 'WhatsApp',
    this.paymentStatus = 'Unpaid',
    required this.orderDate,
    this.status = 'Pending',
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number'] ?? json['orderNumber'] ?? json['id']?.toString() ?? '',
      items: [],
      totalAmount: (json['total_amount'] ?? json['totalAmount'] ?? 0.0).toDouble(),
      customerName: json['customer_name'] ?? json['customerName'] ?? '',
      customerPhone: json['customer_phone'] ?? json['customerPhone'] ?? '',
      customerAddress: json['customer_address'] ?? json['customerAddress'] ?? '',
      paymentMethod: json['payment_method'] ?? json['paymentMethod'] ?? 'WhatsApp',
      paymentStatus: json['payment_status'] ?? json['paymentStatus'] ?? 'Unpaid',
      orderDate: DateTime.parse(json['created_at'] ?? json['order_date'] ?? json['orderDate'] ?? DateTime.now().toIso8601String()),
      status: json['status'] ?? 'Pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_number': orderNumber,
      'total_amount': totalAmount,
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'customer_address': customerAddress,
      'payment_method': paymentMethod,
      'payment_status': paymentStatus,
      'status': status,
    };
  }
}
