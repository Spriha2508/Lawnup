/**
 * purchasesService — RevenueCat integration.
 *
 * Single place the app talks to RevenueCat. Activates automatically once
 * EXPO_PUBLIC_REVENUECAT_ANDROID_KEY is set in .env AND a native build includes
 * react-native-purchases (rebuild required — native module). Until the key is
 * present, every call is a safe no-op so dev/CI builds without it stay green.
 *
 * Setup: docs/revenuecat-setup.md.
 *
 * Flow:
 *   App boot → initPurchases(uid)
 *   Paywall  → purchase(tier) → on success → applyEntitlement()
 *   Launch / restore → syncEntitlement()
 */
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { useSubscriptionStore } from '../store/subscriptionStore';
import type { PremiumTier } from '../constants/plans';

const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

// Live only when the public SDK key is configured.
export const PAYMENTS_READY = ANDROID_KEY.length > 0;

// RevenueCat entitlement identifier (create in the RC dashboard).
export const ENTITLEMENT_ID = 'premium';

// Play product identifiers → our PremiumTier (must match RC offering packages).
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

let configured = false;

/** Initialise RevenueCat once at app start (call from App boot when ready). */
export async function initPurchases(appUserId?: string): Promise<void> {
  if (!PAYMENTS_READY || configured) return;
  try {
    Purchases.configure({ apiKey: ANDROID_KEY, appUserID: appUserId ?? null });
    configured = true;
  } catch {
    // Native module not linked (e.g. running JS without a rebuild) — stay off.
  }
}

function tierFromCustomerInfo(info: CustomerInfo): { active: boolean; expiresAt?: string | null } {
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  return ent ? { active: true, expiresAt: ent.expirationDate } : { active: false };
}

/** Purchase the given tier. Returns success + resolved tier, or cancelled/error. */
export async function purchase(tier: PremiumTier): Promise<PurchaseResult> {
  if (!PAYMENTS_READY) return { success: false, error: 'payments_not_configured' };
  try {
    await initPurchases();
    const offerings = await Purchases.getOfferings();
    const pkg: PurchasesPackage | undefined = offerings.current?.availablePackages.find(
      (p) => PRODUCT_TIER[p.product.identifier] === tier,
    );
    if (!pkg) return { success: false, error: 'package_not_found' };

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const { active, expiresAt } = tierFromCustomerInfo(customerInfo);
    if (active) {
      applyEntitlement(tier, expiresAt);
      return { success: true, tier };
    }
    return { success: false, error: 'no_entitlement' };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true };
    return { success: false, error: e?.message ?? 'purchase_failed' };
  }
}

/** Restore prior purchases (Play account-level). */
export async function restore(): Promise<PurchaseResult> {
  if (!PAYMENTS_READY) return { success: false, error: 'payments_not_configured' };
  try {
    await initPurchases();
    const customerInfo = await Purchases.restorePurchases();
    const { active, expiresAt } = tierFromCustomerInfo(customerInfo);
    if (active) {
      applyEntitlement(undefined, expiresAt);
      return { success: true };
    }
    return { success: false, error: 'nothing_to_restore' };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'restore_failed' };
  }
}

/** Re-read entitlement on launch and reconcile the local store. */
export async function syncEntitlement(): Promise<void> {
  if (!PAYMENTS_READY) return;
  try {
    await initPurchases();
    const customerInfo = await Purchases.getCustomerInfo();
    const { active, expiresAt } = tierFromCustomerInfo(customerInfo);
    if (active) applyEntitlement(undefined, expiresAt);
    else useSubscriptionStore.getState().setPlan('free');
  } catch {
    // Offline / not linked — leave the persisted plan as-is.
  }
}

/** Reflect an active entitlement in the subscription store. */
export function applyEntitlement(tier: PremiumTier | undefined, expiresAtISO?: string | null): void {
  useSubscriptionStore.getState().setPlan('premium', expiresAtISO ?? undefined, tier);
}
