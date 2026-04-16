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
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  acknowledgePurchaseAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
  PurchaseError,
  ProductAndroid,
  Purchase,
  ErrorCode,
} from "react-native-iap";
import { EventSubscription } from "react-native-iap";
import { Platform } from "react-native";

export const PRODUCT_ID = "premium_unlock";

type PremiumCallback = () => void;

let _onPremiumUnlocked: PremiumCallback | null = null;
let _purchaseUpdateSub: EventSubscription | null = null;
let _purchaseErrorSub: EventSubscription | null = null;
let _isConnected = false;
let _product: ProductAndroid | null = null;

/**
 * Safely extract the display price from a ProductAndroid.
 * oneTimePurchaseOfferDetailsAndroid is an array — take the first entry.
 */
export function getProductPrice(product: ProductAndroid): string {
  const details = product.oneTimePurchaseOfferDetailsAndroid;
  if (Array.isArray(details) && details.length > 0) {
    return details[0].formattedPrice ?? "Buy Now";
  }
  return "Buy Now";
}

/**
 * Acknowledge + handle a successful purchase.
 */
async function handlePurchase(purchase: Purchase) {
  if (purchase.productId !== PRODUCT_ID) return;

  if (Platform.OS === "android" && purchase.purchaseToken) {
    try {
      await acknowledgePurchaseAndroid(purchase.purchaseToken);
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
   */
  async init(onPremiumUnlocked: PremiumCallback): Promise<void> {
    _onPremiumUnlocked = onPremiumUnlocked;

    if (Platform.OS !== "android" && Platform.OS !== "ios") return;

    try {
      await initConnection();
      _isConnected = true;
      console.log("[BillingService] Connected to Google Play Billing");
    } catch (e) {
      console.warn("[BillingService] initConnection failed:", e);
      return;
    }

    _purchaseUpdateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      await handlePurchase(purchase);
    });

    _purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
      if (error.code !== ErrorCode.UserCancelled) {
        console.warn("[BillingService] Purchase error:", error.message);
      }
    });

    await BillingService.checkExistingPurchase();
    await BillingService.loadProduct();
  },

  /**
   * Check Google Play for any existing ownership of premium_unlock.
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
   */
  async loadProduct(): Promise<ProductAndroid | null> {
    if (!_isConnected) return null;
    try {
      const products = await fetchProducts({ skus: [PRODUCT_ID] });
      if (products && products.length > 0) {
        _product = products[0] as ProductAndroid;
        console.log("[BillingService] Product loaded:", getProductPrice(_product));
      } else {
        console.warn("[BillingService] Product not found on Play Store:", PRODUCT_ID);
      }
    } catch (e) {
      console.warn("[BillingService] fetchProducts failed:", e);
    }
    return _product;
  },

  /**
   * Get the cached product (call loadProduct first).
   */
  getProduct(): ProductAndroid | null {
    return _product;
  },

  /**
   * Launch the Google Play purchase sheet for premium_unlock.
   */
  async purchase(): Promise<void> {
    if (!_isConnected) {
      console.warn("[BillingService] Not connected — cannot purchase");
      return;
    }

    if (!_product) {
      await BillingService.loadProduct();
    }

    try {
      await requestPurchase({
        type: "in-app",
        request: {
          google: { skus: [PRODUCT_ID] },
        },
      });
    } catch (e: any) {
      if (e?.code !== ErrorCode.UserCancelled) {
        console.warn("[BillingService] requestPurchase failed:", e?.message);
      }
    }
  },

  /**
   * Restore existing purchases (e.g. after reinstall).
   */
  async restorePurchases(): Promise<boolean> {
    return BillingService.checkExistingPurchase();
  },

  /**
   * Clean up listeners and close the billing connection.
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