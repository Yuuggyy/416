import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../theme/app_theme.dart';

class CartDrawer extends StatefulWidget {
  const CartDrawer({super.key});

  @override
  State<CartDrawer> createState() => _CartDrawerState();
}

class _CartDrawerState extends State<CartDrawer> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final isNarrow = screenWidth < 500;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag indicator & Title
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.surfaceBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.shopping_bag, color: AppTheme.primaryLight, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Panier Merch 416 (${cart.itemCount})',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              if (cart.items.isNotEmpty)
                TextButton(
                  onPressed: () => cart.clearCart(),
                  child: const Text('Vider', style: TextStyle(color: AppTheme.error, fontSize: 12)),
                ),
            ],
          ),
          const Divider(color: AppTheme.surfaceBorder),

          // Items List
          Expanded(
            child: cart.items.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.remove_shopping_cart, size: 50, color: AppTheme.textMuted),
                        SizedBox(height: 12),
                        Text(
                          'Votre panier est vide',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 15),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Découvrez les t-shirts, hoodies et vinyles 416 Records dans la boutique !',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.surfaceBorder),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                item.item.imageUrl,
                                width: 48,
                                height: 48,
                                fit: BoxFit.cover,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.item.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Taille: ${item.selectedSize} • ${item.item.price.toStringAsFixed(2)} €',
                                    style: const TextStyle(
                                      color: AppTheme.textSecondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Quantity Controls
                            Row(
                              children: [
                                IconButton(
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  icon: const Icon(Icons.remove_circle_outline, size: 18),
                                  onPressed: () => cart.updateQuantity(index, -1),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 6),
                                  child: Text(
                                    '${item.quantity}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  icon: const Icon(Icons.add_circle_outline, size: 18),
                                  onPressed: () => cart.updateQuantity(index, 1),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          if (cart.items.isNotEmpty) ...[
            const Divider(color: AppTheme.surfaceBorder),

            // Form inputs
            Form(
              key: _formKey,
              child: Column(
                children: [
                  if (isNarrow) ...[
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Nom Complet',
                        isDense: true,
                      ),
                      validator: (v) => v?.isEmpty == true ? 'Requis' : null,
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Téléphone',
                        isDense: true,
                      ),
                      validator: (v) => v?.isEmpty == true ? 'Requis' : null,
                    ),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              labelText: 'Nom Complet',
                              isDense: true,
                            ),
                            validator: (v) => v?.isEmpty == true ? 'Requis' : null,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _phoneController,
                            decoration: const InputDecoration(
                              labelText: 'Téléphone',
                              isDense: true,
                            ),
                            validator: (v) => v?.isEmpty == true ? 'Requis' : null,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _addressController,
                    decoration: const InputDecoration(
                      labelText: 'Adresse de livraison',
                      isDense: true,
                    ),
                    validator: (v) => v?.isEmpty == true ? 'Requis' : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Total & Checkout
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total TTC:',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                ),
                Text(
                  '${cart.totalPrice.toStringAsFixed(2)} €',
                  style: const TextStyle(
                    color: AppTheme.primaryLight,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  if (_formKey.currentState?.validate() == true) {
                    cart.checkoutWhatsApp(
                      name: _nameController.text,
                      phone: _phoneController.text,
                      address: _addressController.text,
                    );
                  }
                },
                icon: const Icon(Icons.chat_bubble_outline, size: 20),
                label: const Text('COMMANDER VIA WHATSAPP', style: TextStyle(fontSize: 13)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
