import {
  AuthorizationStatus,
  blockSelection,
  configureActions,
  getAuthorizationStatus,
  isAvailable,
  requestAuthorization as requestScreenTimeAuthorization,
  resetBlocks,
  setFamilyActivitySelectionId,
  startMonitoring,
  stopMonitoring,
  unblockSelection,
  updateShield,
} from 'react-native-device-activity';

import { SELECTION_ID } from '../state/actions';
import type { SelectionSnapshot } from '../state/types';

/**
 * Screen Time boundary.
 *
 * Apple hands back an opaque selection rather than app identities, so everything the user picked is
 * shielded as one unit under SELECTION_ID. In Expo Go (no entitlement, no native module) every call
 * is a no-op and the mock app list below stands in for Apple's picker.
 */

/** Key the native module stores our selection under, shared with the shield extensions. */
const NATIVE_SELECTION_ID = 'gatieSelection';
const UNLOCK_ACTIVITY = 'gatieUnlockWindow';
const UNLOCK_EVENT = 'unlockWindow';

function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.warn('Gatie: Screen Time call failed', e);
    return fallback;
  }
}

/** False in Expo Go and in any build without the Family Controls entitlement. */
export const isNativeBlocking = safely(() => isAvailable(), false);

export type BlockableApp = {
  id: string;
  name: string;
};

/** Stand-ins for Apple's picker so the flow can be built and demoed in Expo Go. */
export const MOCK_SHOPPING_APPS: BlockableApp[] = [
  { id: 'amazon', name: 'Amazon' },
  { id: 'shein', name: 'Shein' },
  { id: 'temu', name: 'Temu' },
  { id: 'ebay', name: 'eBay' },
  { id: 'wish', name: 'Wish' },
  { id: 'aliexpress', name: 'AliExpress' },
  { id: 'walmart', name: 'Walmart' },
  { id: 'target', name: 'Target' },
  { id: 'etsy', name: 'Etsy' },
];

export const findApp = (id: string): BlockableApp =>
  id === SELECTION_ID
    ? { id, name: 'Your blocked apps' }
    : (MOCK_SHOPPING_APPS.find((a) => a.id === id) ?? { id, name: 'This app' });

/** Apple requires a schedule of at least 15 minutes, so it runs to end of day and the usage threshold ends the window. */
function todayWindow() {
  const now = new Date();
  return {
    intervalStart: { hour: now.getHours(), minute: now.getMinutes() },
    intervalEnd: { hour: 23, minute: 59 },
    repeats: false,
  };
}

export const blocking = {
  isNative: isNativeBlocking,

  async requestAuthorization(): Promise<boolean> {
    if (!isNativeBlocking) return true;
    const approved = () => safely(() => getAuthorizationStatus(), AuthorizationStatus.notDetermined) === AuthorizationStatus.approved;
    if (approved()) return true;
    try {
      await requestScreenTimeAuthorization('individual');
    } catch (e) {
      console.warn('Gatie: Screen Time authorization was refused', e);
      return false;
    }
    return approved();
  },

  /** Shields the picked apps and points the shield's button back at Gatie. */
  async applyShields(selection: SelectionSnapshot | null): Promise<void> {
    if (!isNativeBlocking) return;
    safely(() => stopMonitoring([UNLOCK_ACTIVITY]), undefined);
    if (!selection) {
      safely(() => resetBlocks(), undefined);
      return;
    }
    safely(() => {
      setFamilyActivitySelectionId({ id: NATIVE_SELECTION_ID, familyActivitySelection: selection.token });
      updateShield(
        {
          title: 'Locked by Gatie',
          subtitle: 'Write down why you’re going in, and this opens.',
          primaryButtonLabel: 'Open Gatie',
          secondaryButtonLabel: 'Not now',
          iconSystemName: 'lock.fill',
        },
        {
          primary: { behavior: 'close', actions: [{ type: 'openApp' }] },
          secondary: { behavior: 'close', actions: [] },
        },
      );
      blockSelection({ activitySelectionId: NATIVE_SELECTION_ID });
    }, undefined);
  },

  /**
   * Lifts the shield, then re-blocks after `minutes` of use. The re-block runs in Apple's extension,
   * so it still happens with Gatie closed — mid-scroll, which is the point.
   */
  async unblockTemporarily(selection: SelectionSnapshot | null, minutes: number): Promise<void> {
    if (!isNativeBlocking || !selection) return;
    safely(() => unblockSelection({ activitySelectionId: NATIVE_SELECTION_ID }), undefined);
    safely(
      () =>
        configureActions({
          activityName: UNLOCK_ACTIVITY,
          callbackName: 'eventDidReachThreshold',
          eventName: UNLOCK_EVENT,
          actions: [{ type: 'blockSelection', familyActivitySelectionId: NATIVE_SELECTION_ID }],
        }),
      undefined,
    );
    try {
      await startMonitoring(UNLOCK_ACTIVITY, todayWindow(), [
        { familyActivitySelection: selection.token, threshold: { minute: minutes }, eventName: UNLOCK_EVENT },
      ]);
    } catch (e) {
      console.warn('Gatie: could not schedule the re-block', e);
    }
  },
};
