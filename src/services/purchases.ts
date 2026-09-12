import Purchases, { LOG_LEVEL, PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat wrapper. Without EXPO_PUBLIC_REVENUECAT_IOS_KEY set, runs a local mock so the paywall
 * can be designed and exercised in Expo Go with no store setup.
 */

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
export const ENTITLEMENT_ID = 'pro';
export const isMockPurchases = !API_KEY;

export type Plan = {
  id: string;
  title: string;
  price: string;
  period: string;
  trial: string | null;
  badge: string | null;
  pkg?: PurchasesPackage;
};

const MOCK_PLANS: Plan[] = [
  { id: 'annual', title: 'Yearly', price: '$24.99', period: 'year', trial: '7-day free trial', badge: 'Save 65%' },
  { id: 'monthly', title: 'Monthly', price: '$5.99', period: 'month', trial: '7-day free trial', badge: null },
];

let configured = false;

export async function initPurchases(): Promise<void> {
  if (isMockPurchases || configured) return;
  if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: API_KEY! });
  configured = true;
}

export async function checkPro(): Promise<boolean | null> {
  if (isMockPurchases) return null;
  const info = await Purchases.getCustomerInfo();
  return ENTITLEMENT_ID in info.entitlements.active;
}

function toPlan(pkg: PurchasesPackage): Plan {
  const intro = pkg.product.introPrice;
  const annual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
  return {
    id: pkg.identifier,
    title: annual ? 'Yearly' : pkg.packageType === PACKAGE_TYPE.MONTHLY ? 'Monthly' : pkg.product.title,
    price: pkg.product.priceString,
    period: annual ? 'year' : 'month',
    trial:
      intro && intro.price === 0
        ? `${intro.periodNumberOfUnits}-${intro.periodUnit.toLowerCase()} free trial`
        : null,
    badge: null,
    pkg,
  };
}

export async function getPlans(): Promise<Plan[]> {
  if (isMockPurchases) return MOCK_PLANS;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages.map(toPlan) ?? [];
}

/** Resolves to whether the user is Pro afterwards; resolves false if they cancel the sheet. */
export async function purchase(plan: Plan): Promise<boolean> {
  if (isMockPurchases || !plan.pkg) return true;
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    return ENTITLEMENT_ID in customerInfo.entitlements.active;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  if (isMockPurchases) return false;
  const info = await Purchases.restorePurchases();
  return ENTITLEMENT_ID in info.entitlements.active;
}
