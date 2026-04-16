/**
 * BillingService.ts
 * Handles Google Play Billing for a single non-consumable product: "premium_unlock"
 *
 * Usage:
 *   - Call BillingService.init(onPremiumUnlocked) once at app startup
 *   - Call BillingService.purchase() when user taps "Remove Ads"
 *   - Call BillingService.restorePurchases() for a restore button
 *   - Call BillingService.destroy() when app unmounts (in _layout cleanup)
 */

import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  acknowledgePurchaseAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductPurchase,
  type PurchaseError,
  type Product,
  type ProductAndroid,
  type EmitterSubscription,
} from "react-native-iap";
import { Platform } from "react-native";

/**
 * Safely extract the display price from a Product regardless of platform.
 * On Android, react-native-iap v12+ stores the price inside
 * oneTimePurchaseOfferDetails. Falls back to a generic string if unavailable.
 */
export function getProductPrice(product: Product): string {
  if (Platform.OS === "android") {
    const android = product as ProductAndroid;
    return (
      android.oneTimePurchaseOfferDetails?.formattedPrice ??
      "Buy Now"
    );
  }
  // iOS — localizedPrice exists on ProductIOS
  return (product as any).localizedPrice ?? "Buy Now";
}

export const PRODUCT_ID = "premium_unlock";

type PremiumCallback = () => void;

let _onPremiumUnlocked: PremiumCallback | null = null;
let _purchaseUpdateSub: EmitterSubscription | null = null;
let _purchaseErrorSub: EmitterSubscription | null = null;
let _isConnected = false;
let _product: Product | null = null;

/**
 * Acknowledge + handle a successful purchase.
 * Calls _onPremiumUnlocked if the product matches.
 */
async function handlePurchase(purchase: ProductPurchase) {
  if (purchase.productId !== PRODUCT_ID) return;

  // Acknowledge on Android (required within 3 days or Google refunds)
  if (Platform.OS === "android" && purchase.purchaseToken) {
    try {
      await acknowledgePurchaseAndroid({
        token: purchase.purchaseToken,
        developerPayload: undefined,
      });
    } catch (e) {
      console.warn("[BillingService] acknowledgePurchaseAndroid failed:", e);
    }
  }

  console.log("[BillingService] Purchase successful:", purchase.productId);
  _onPremiumUnlocked?.();
}

export const BillingService = {
  /**
   * Connect to Google Play Billing, register listeners, and check if the
   * user already owns premium_unlock. Call this once at app startup.
   *
   * @param onPremiumUnlocked  Called when premium is confirmed (startup or new purchase)
   */
  async init(onPremiumUnlocked: PremiumCallback): Promise<void> {
    _onPremiumUnlocked = onPremiumUnlocked;

    // react-native-iap only works on Android/iOS, not web
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;

    try {
      await initConnection();
      _isConnected = true;
      console.log("[BillingService] Connected to Google Play Billing");
    } catch (e) {
      console.warn("[BillingService] initConnection failed:", e);
      return;
    }

    // Listen for new purchases (launched via requestPurchase)
    _purchaseUpdateSub = purchaseUpdatedListener(
      async (purchase: ProductPurchase) => {
        await handlePurchase(purchase);
      }
    );

    // Listen for purchase errors
    _purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
      // Code 2 = user cancelled, not a real error
      if (error.code !== "E_USER_CANCELLED") {
        console.warn("[BillingService] Purchase error:", error.message);
      }
    });

    // Check if user already owns the product (app reinstall / new device)
    await BillingService.checkExistingPurchase();

    // Pre-fetch product details so purchase flow is instant
    await BillingService.loadProduct();
  },

  /**
   * Check Google Play for any existing ownership of premium_unlock.
   * Silently unlocks premium if found.
   */
  async checkExistingPurchase(): Promise<boolean> {
    if (!_isConnected) return false;
    try {
      const purchases = await getAvailablePurchases();
      const owned = purchases.some((p) => p.productId === PRODUCT_ID);
      if (owned) {
        console.log("[BillingService] Existing purchase found — unlocking premium");
        _onPremiumUnlocked?.();
        return true;
      }
    } catch (e) {
      console.warn("[BillingService] getAvailablePurchases failed:", e);
    }
    return false;
  },

  /**
   * Pre-fetch product details from Google Play.
   * Returns the Product or null.
   */
  async loadProduct(): Promise<Product | null> {
    if (!_isConnected) return null;
    try {
      const products = await getProducts({ skus: [PRODUCT_ID] });
      if (products.length > 0) {
        _product = products[0];
        console.log("[BillingService] Product loaded:", _product.localizedPrice);
      } else {
        console.warn("[BillingService] Product not found on Play Store:", PRODUCT_ID);
      }
    } catch (e) {
      console.warn("[BillingService] getProducts failed:", e);
    }
    return _product;
  },

  /**
   * Get the cached product (call loadProduct first).
   * Returns the Product or null if not yet loaded.
   */
  getProduct(): Product | null {
    return _product;
  },

  /**
   * Launch the Google Play purchase sheet for premium_unlock.
   * The purchaseUpdatedListener in init() will handle the result.
   */
  async purchase(): Promise<void> {
    if (!_isConnected) {
      console.warn("[BillingService] Not connected — cannot purchase");
      return;
    }

    // Make sure product is loaded
    if (!_product) {
      await BillingService.loadProduct();
    }

    try {
      await requestPurchase({ skus: [PRODUCT_ID] });
      // Result handled by purchaseUpdatedListener — no need to await here
    } catch (e: any) {
      // E_USER_CANCELLED is normal (user dismissed sheet)
      if (e?.code !== "E_USER_CANCELLED") {
        console.warn("[BillingService] requestPurchase failed:", e?.message);
      }
    }
  },

  /**
   * Restore existing purchases (e.g. after reinstall).
   * Call this from a "Restore Purchase" button.
   */
  async restorePurchases(): Promise<boolean> {
    return BillingService.checkExistingPurchase();
  },

  /**
   * Clean up listeners and close the billing connection.
   * Call this when the root layout unmounts.
   */
  destroy() {
    _purchaseUpdateSub?.remove();
    _purchaseErrorSub?.remove();
    _purchaseUpdateSub = null;
    _purchaseErrorSub = null;
    if (_isConnected) {
      endConnection();
      _isConnected = false;
    }
  },
};
