/**
 * purchasesService — RevenueCat integration seam.
 *
 * This is the single place the app talks to RevenueCat. It is intentionally
 * written WITHOUT importing `react-native-purchases` yet, so the bundle stays
 * green until the native package is installed (Metro would fail to resolve a
 * missing module). Each function has a TODO showing the exact RC call to add.
 *
 * Wiring checklist lives in docs/revenuecat-setup.md and the RevenueCat task.
 *
 * Flow once wired:
 *   App boot → initPurchases()
 *   Paywall  → purchase(tier) → on success → applyEntitlement()
 *   Launch / restore → syncEntitlement()
 */
import { useSubscriptionStore } from '../store/subscriptionStore';
import type { PremiumTier } from '../constants/plans';

// Flip to true once react-native-purchases is installed, configured, and the
// functions below are filled in. Gates every call so nothing runs half-wired.
export const PAYMENTS_READY = false;

// RevenueCat entitlement identifier (create in the RC dashboard).
export const ENTITLEMENT_ID = 'premium';

// Map RC product identifiers → our PremiumTier. Set these to the Play product
// IDs you create (must match RevenueCat offering packages).
export const PRODUCT_TIER: Record<string, PremiumTier> = {
  lawnup_premium_monthly: 'monthly',
  lawnup_premium_annual: 'annual',
};

export interface PurchaseResult {
  success: boolean;
  tier?: PremiumTier;
  cancelled?: boolean;
  error?: string;
}

/** Initialise RevenueCat once at app start (call from App boot when ready). */
export async function initPurchases(_appUserId?: string): Promise<void> {
  if (!PAYMENTS_READY) return;
  // TODO(revenuecat):
  // import Purchases from 'react-native-purchases';
  // Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!, appUserID: _appUserId });
}

/** Purchase the given tier. Returns success + resolved tier, or cancelled/error. */
export async function purchase(tier: PremiumTier): Promise<PurchaseResult> {
  if (!PAYMENTS_READY) return { success: false, error: 'payments_not_configured' };
  // TODO(revenuecat):
  // const offerings = await Purchases.getOfferings();
  // const pkg = offerings.current?.availablePackages.find(p => PRODUCT_TIER[p.product.identifier] === tier);
  // if (!pkg) return { success: false, error: 'package_not_found' };
  // try {
  //   const { customerInfo } = await Purchases.purchasePackage(pkg);
  //   if (customerInfo.entitlements.active[ENTITLEMENT_ID]) { applyEntitlement(tier, customerInfo.entitlements.active[ENTITLEMENT_ID].expirationDate); return { success: true, tier }; }
  //   return { success: false, error: 'no_entitlement' };
  // } catch (e: any) { return e?.userCancelled ? { success: false, cancelled: true } : { success: false, error: e?.message }; }
  return { success: false, error: 'payments_not_configured' };
}

/** Restore prior purchases (App Store / Play account-level). */
export async function restore(): Promise<PurchaseResult> {
  if (!PAYMENTS_READY) return { success: false, error: 'payments_not_configured' };
  // TODO(revenuecat):
  // const customerInfo = await Purchases.restorePurchases();
  // const ent = customerInfo.entitlements.active[ENTITLEMENT_ID];
  // if (ent) { applyEntitlement(undefined, ent.expirationDate); return { success: true }; }
  return { success: false, error: 'nothing_to_restore' };
}

/** Re-read entitlement on launch and reconcile the local store. */
export async function syncEntitlement(): Promise<void> {
  if (!PAYMENTS_READY) return;
  // TODO(revenuecat):
  // const customerInfo = await Purchases.getCustomerInfo();
  // const ent = customerInfo.entitlements.active[ENTITLEMENT_ID];
  // if (ent) applyEntitlement(undefined, ent.expirationDate);
  // else useSubscriptionStore.getState().setPlan('free');
}

/** Reflect an active entitlement in the subscription store. */
export function applyEntitlement(tier: PremiumTier | undefined, expiresAtISO?: string | null): void {
  useSubscriptionStore.getState().setPlan('premium', expiresAtISO ?? undefined, tier);
}
