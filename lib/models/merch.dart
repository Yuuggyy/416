class MerchItem {
  final String id;
  final String sku;
  final String name;
  final double price;
  final String currency;
  final String description;
  final String imageUrl;
  final String category; // 'T-Shirts', 'Hoodies', 'Vinyles', 'Accessoires', 'Casquettes'
  final List<String> availableSizes;
  final int stockQuantity;
  final bool isNew;
  final bool inStock;

  MerchItem({
    required this.id,
    this.sku = '',
    required this.name,
    required this.price,
    this.currency = '€',
    required this.description,
    required this.imageUrl,
    required this.category,
    this.availableSizes = const ['S', 'M', 'L', 'XL', 'XXL'],
    this.stockQuantity = 50,
    this.isNew = false,
    this.inStock = true,
  });

  factory MerchItem.fromJson(Map<String, dynamic> json) {
    return MerchItem(
      id: json['id']?.toString() ?? '',
      sku: json['sku'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      currency: json['currency'] ?? '€',
      description: json['description'] ?? '',
      imageUrl: json['image_url'] ?? json['imageUrl'] ?? '',
      category: json['category'] ?? 'Vêtements',
      availableSizes: List<String>.from(json['available_sizes'] ?? json['availableSizes'] ?? ['M', 'L', 'XL']),
      stockQuantity: json['stock_quantity'] ?? json['stockQuantity'] ?? 50,
      isNew: json['is_new'] ?? json['isNew'] ?? false,
      inStock: json['in_stock'] ?? json['inStock'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sku': sku,
      'name': name,
      'price': price,
      'currency': currency,
      'description': description,
      'image_url': imageUrl,
      'category': category,
      'available_sizes': availableSizes,
      'stock_quantity': stockQuantity,
      'is_new': isNew,
      'in_stock': inStock,
    };
  }
}
