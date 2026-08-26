/**
 * Flutterwave Payment Integration for 416 Records.
 *
 * Supports: M-Pesa (Vodacom), Airtel Money, Orange Money — all via one API.
 * DRC Congo mobile money payments through Flutterwave.
 *
 * Setup:
 * 1. Create a Flutterwave account at https://flutterwave.com
 * 2. Get your API keys (Public Key + Secret Key) from the dashboard
 * 3. Add them to your environment variables or Supabase secrets:
 *    - FLW_PUBLIC_KEY: FLWPUBK-xxxxxxxx-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 *    - FLW_SECRET_KEY: FLWSECK-xxxxxxxx-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 * 4. Set your webhook URL in Flutterwave dashboard to receive payment confirmations
 *
 * Payment flow:
 * 1. User clicks "Pay" → Flutterwave modal opens
 * 2. User selects mobile money (M-Pesa, Airtel, Orange) and enters phone
 * 3. Flutterwave sends a push payment request to the user's phone
 * 4. User confirms on their phone → payment completed
 * 5. Flutterwave webhook hits our backend → subscription activated automatically
 */

// Flutterwave public key — replace with your actual key
// This is safe to expose in frontend (it's the public key, not the secret)
export const FLW_PUBLIC_KEY = import.meta.env?.VITE_FLW_PUBLIC_KEY || "";

// Payment configuration
export const FLW_CONFIG = {
  // Flutterwave API base URL
  baseUrl: "https://api.flutterwave.com/v3",
  // Your merchant account currency
  currency: "CDF", // Congolese Franc
  // Payment options available in DRC
  paymentOptions: "mobilemoneyghana,mobilemoneyuganda,mobilemoneyrwanda,mobilemoneyzambia,mobilemoneyfranco,mpesa,card",
  // Redirect URL after payment
  redirectUrl: typeof window !== "undefined" ? `${window.location.origin}/premium` : "",
  // Webhook URL for payment confirmation
  webhookUrl: typeof window !== "undefined" ? `${window.location.origin}/api/flw-webhook` : "",
};

export type PaymentOption = {
  id: string;
  label: string;
  icon: string;
  flwOption: string; // Flutterwave payment type
};

// Payment methods available in DRC Congo
export const PAYMENT_METHODS: PaymentOption[] = [
  { id: "mpesa", label: "M-Pesa (Vodacom)", icon: "📱", flwOption: "mpesa" },
  { id: "airtel", label: "Airtel Money", icon: "📲", flwOption: "mobilemoneyfranco" },
  { id: "orange", label: "Orange Money", icon: "🟠", flwOption: "mobilemoneyfranco" },
  { id: "card", label: "Carte bancaire", icon: "💳", flwOption: "card" },
];

export type PaymentResult = {
  success: boolean;
  transactionId?: string;
  message: string;
};

/**
 * Initialize a Flutterwave payment.
 * In production, this loads the Flutterwave inline modal.
 *
 * @param amount - Amount in FC (Congolese Francs)
 * @param customer - Customer info (email, phone)
 * @param paymentMethod - Which mobile money provider
 * @returns Payment result with transaction ID
 */
export async function initiatePayment(
  amount: number,
  customer: { email: string; phone?: string; name?: string },
  paymentMethod: string,
): Promise<PaymentResult> {
  if (!FLW_PUBLIC_KEY) {
    return {
      success: false,
      message: "Flutterwave non configuré. Ajoutez VITE_FLW_PUBLIC_KEY.",
    };
  }

  try {
    // Load Flutterwave inline script
    await loadFlutterwaveScript();

    return new Promise<PaymentResult>((resolve) => {
      // @ts-expect-error - Flutterwave inline modal
      const modal = window.FlutterwaveCheckout({
        public_key: FLW_PUBLIC_KEY,
        tx_ref: `416-${Date.now()}`,
        amount: amount,
        currency: FLW_CONFIG.currency,
        payment_options: paymentMethod,
        customer: {
          email: customer.email,
          phone_number: customer.phone,
          name: customer.name,
        },
        customizations: {
          title: "416 Records",
          description: "Accès Saison Premium S1 2026",
          logo: "https://416records.netlify.app/icon-192.png",
        },
        callback: (response: any) => {
          modal.close();
          if (response.status === "successful" || response.status === "completed") {
            resolve({
              success: true,
              transactionId: response.transaction_id || response.tx_ref,
              message: "Paiement réussi ! Votre accès est activé.",
            });
          } else {
            resolve({
              success: false,
              message: response.message || "Paiement échoué",
            });
          }
        },
        onclose: () => {
          resolve({
            success: false,
            message: "Paiement annulé",
          });
        },
      });
    });
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Erreur lors du paiement",
    };
  }
}

/** Load Flutterwave inline script */
function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger Flutterwave"));
    document.head.appendChild(script);
  });
}

// Type augmentation for window.FlutterwaveCheckout
declare global {
  interface Window {
    FlutterwaveCheckout?: (config: any) => { close: () => void };
  }
}
