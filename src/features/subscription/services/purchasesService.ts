/**
 * purchasesService — RevenueCat integration (modern SDK 10 + RevenueCatUI).
 *
 * One place the app talks to RevenueCat. Activates automatically once
 * EXPO_PUBLIC_REVENUECAT_ANDROID_KEY is set AND a native build includes
 * react-native-purchases / react-native-purchases-ui (rebuild required). Until
 * the key is present every call is a safe no-op. Setup: docs/revenuecat-setup.md.
 *
 * Best practices applied here:
 *   • A single CustomerInfo update listener is the source of truth — entitlement
 *     changes (purchase, renewal, expiry, restore, refund) reconcile the store
 *     in real time, not just on launch.
 *   • The hosted Paywall (RevenueCatUI) and Customer Center are used for
 *     purchase + subscription management instead of hand-built screens.
 *   • Package selection is by packageType (ANNUAL/MONTHLY), robust to product-id
 *     naming. Errors are caught; user cancellation is distinguished from failure.
 */
import Purchases, {
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSubscriptionStore } from '../store/subscriptionStore';
import type { PremiumTier } from '../constants/plans';

// TODO(play-store): RevenueCat is intentionally DORMANT until Google Play Console
// exists. The Android public SDK key is read from EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
// which is BLANK on purpose (see .env + PLAY_STORE_SETUP.md). While blank,
// PAYMENTS_READY is false and every export below is a guarded no-op, so the app runs
// normally with no subscriptions. To go live: create the Play account → create the
// monthly + yearly subscription products → connect Play to RevenueCat → set this key
// (must start with `goog_`). Until then, do NOT paste a `test_`/placeholder value:
// it would flip PAYMENTS_READY true with no real offerings and break the upgrade flow.
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

/** Live only when the public SDK key is configured. */
export const PAYMENTS_READY = ANDROID_KEY.length > 0;

// QA round (P0-4): until real payments are live, allow the paywall CTA to flip a
// LOCAL mock premium so the full upgrade flow is testable on internal builds.
// HARD-GATED off in production so a fake "purchase" can NEVER reach the store —
// the production build keeps the honest "coming soon" state until PAYMENTS_READY.
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
export const MOCK_PREMIUM_ENABLED = !PAYMENTS_READY && APP_ENV !== 'production';

/** RevenueCat entitlement identifier — MUST match the dashboard exactly. */
export const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT || 'premium';

// TODO(play-store): these product identifiers MUST match the subscription product IDs
// created in BOTH Google Play Console and the RevenueCat dashboard. `lawnup_premium_*`
// are the planned IDs — confirm/adjust them when the Play subscriptions are created.
/** Fallback product-id → tier map (packageType is the primary signal). */
export const PRODUCT_TIER: Record<string, PremiumTier> = {
  yearly: 'annual',
  monthly: 'monthly',
  lawnup_premium_annual: 'annual',
  lawnup_premium_monthly: 'monthly',
};

export interface PurchaseResult {
  success: boolean;
  tier?: PremiumTier;
  cancelled?: boolean;
  error?: string;
}

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'not_presented' | 'error';

let configured = false;

// ── Reconcile RevenueCat truth → local subscription store ────────────────────
function tierFromEntitlement(info: CustomerInfo): PremiumTier | undefined {
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  if (!ent) return undefined;
  const pid = ent.productIdentifier ?? '';
  if (PRODUCT_TIER[pid]) return PRODUCT_TIER[pid];
  return /year|annual/i.test(pid) ? 'annual' : 'monthly';
}

function reconcile(info: CustomerInfo): void {
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  if (ent) {
    useSubscriptionStore.getState().setPlan('premium', ent.expirationDate ?? undefined, tierFromEntitlement(info));
  } else {
    useSubscriptionStore.getState().setPlan('free');
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
export async function initPurchases(appUserId?: string): Promise<void> {
  if (!PAYMENTS_READY || configured) return;
  try {
    Purchases.configure({ apiKey: ANDROID_KEY, appUserID: appUserId ?? null });
    // Real-time source of truth: reconcile on every entitlement change.
    Purchases.addCustomerInfoUpdateListener(reconcile);
    configured = true;
  } catch {
    // Native module not linked (JS without a rebuild) — stay off.
  }
}

/** Re-read entitlement on launch / resume and reconcile the store. */
export async function syncEntitlement(): Promise<void> {
  if (!PAYMENTS_READY) return;
  try {
    await initPurchases();
    reconcile(await Purchases.getCustomerInfo());
  } catch {
    // Offline / not linked — leave the persisted plan as-is.
  }
}

/** True iff the "Lawnup Premium" entitlement is currently active. */
export async function isPremiumActive(): Promise<boolean> {
  if (!PAYMENTS_READY) return false;
  try {
    await initPurchases();
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] != null;
  } catch {
    return false;
  }
}

// ── Custom purchase (used by the in-app PaywallScreen) ───────────────────────
export async function purchase(tier: PremiumTier): Promise<PurchaseResult> {
  if (!PAYMENTS_READY) return { success: false, error: 'payments_not_configured' };
  try {
    await initPurchases();
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    const wantType = tier === 'annual' ? PACKAGE_TYPE.ANNUAL : PACKAGE_TYPE.MONTHLY;
    const pkg: PurchasesPackage | undefined =
      pkgs.find((p) => p.packageType === wantType) ??
      pkgs.find((p) => PRODUCT_TIER[p.product.identifier] === tier);
    if (!pkg) return { success: false, error: 'package_not_found' };

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    reconcile(customerInfo);
    return customerInfo.entitlements.active[ENTITLEMENT_ID]
      ? { success: true, tier }
      : { success: false, error: 'no_entitlement' };
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
    const info = await Purchases.restorePurchases();
    reconcile(info);
    return info.entitlements.active[ENTITLEMENT_ID]
      ? { success: true }
      : { success: false, error: 'nothing_to_restore' };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'restore_failed' };
  }
}

// ── Hosted RevenueCat Paywall (modern, dashboard-designed) ───────────────────
/** Present the current offering's RevenueCat Paywall. Reconciles on success. */
export async function presentPaywall(): Promise<PaywallOutcome> {
  if (!PAYMENTS_READY) return 'not_presented';
  try {
    await initPurchases();
    const result = await RevenueCatUI.presentPaywall();
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        await syncEntitlement();
        return 'purchased';
      case PAYWALL_RESULT.RESTORED:
        await syncEntitlement();
        return 'restored';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      case PAYWALL_RESULT.NOT_PRESENTED:
        return 'not_presented';
      default:
        return 'error';
    }
  } catch {
    return 'error';
  }
}

/**
 * Present the paywall only if the user lacks the entitlement. Returns true if
 * the user ends up entitled (already had it, or just purchased/restored).
 */
export async function presentPaywallIfNeeded(): Promise<boolean> {
  if (!PAYMENTS_READY) return false;
  try {
    await initPurchases();
    const result = await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: ENTITLEMENT_ID });
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) await syncEntitlement();
    return result !== PAYWALL_RESULT.CANCELLED && result !== PAYWALL_RESULT.ERROR;
  } catch {
    return false;
  }
}

// ── Customer Center (manage / cancel / restore / refund) ─────────────────────
export async function presentCustomerCenter(): Promise<void> {
  if (!PAYMENTS_READY) return;
  try {
    await initPurchases();
    await RevenueCatUI.presentCustomerCenter();
    // The Customer Center can change subscription state — reconcile after.
    await syncEntitlement();
  } catch {
    /* not linked / dismissed */
  }
}

/** Reflect an active entitlement in the subscription store (manual escape hatch). */
export function applyEntitlement(tier: PremiumTier | undefined, expiresAtISO?: string | null): void {
  useSubscriptionStore.getState().setPlan('premium', expiresAtISO ?? undefined, tier);
}
