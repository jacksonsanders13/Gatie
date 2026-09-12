import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type PaywallReason = 'apps' | 'stats' | 'wait';

export type RootStackParamList = {
  Onboarding: undefined;
  AppPicker: { fromOnboarding?: boolean } | undefined;
  Dashboard: undefined;
  ReflectionUnlock: { appId: string };
  Paywall: { reason?: PaywallReason } | undefined;
  Settings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
