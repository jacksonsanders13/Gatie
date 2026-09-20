import { createNavigationContainerRef, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';

import AppPickerScreen from '../screens/AppPickerScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PaywallScreen from '../screens/PaywallScreen';
import ReflectionUnlockScreen from '../screens/ReflectionUnlockScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { onUnlockNotificationTap } from '../services/notifications';
import { useStore } from '../state/store';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** The shield's "Open Gatie" button launches this URL; the library hardcodes the scheme. */
const SHIELD_URL_PREFIX = 'device-activity:';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.bg,
    text: colors.ink,
    border: colors.line,
  },
};

export default function RootNavigator() {
  const { state, hydrated } = useStore();
  const pendingAppId = useRef<string | null>(null);
  const blockedAppId = state.blockedAppIds[0] ?? null;

  const openGate = useCallback((appId: string) => {
    if (navigationRef.isReady()) navigationRef.navigate('ReflectionUnlock', { appId });
    else pendingAppId.current = appId;
  }, []);

  // Opening a shielded app sends the user here; go straight to the gate rather than the dashboard.
  useEffect(() => {
    if (!blockedAppId) return;
    const handle = (url: string | null) => {
      if (url?.startsWith(SHIELD_URL_PREFIX)) openGate(blockedAppId);
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    // Apple blocks the shield from launching us directly, so its notification is the real entry point.
    const unsubscribeNotifications = onUnlockNotificationTap(() => openGate(blockedAppId));
    return () => {
      sub.remove();
      unsubscribeNotifications();
    };
  }, [blockedAppId, openGate]);

  const onReady = () => {
    if (pendingAppId.current) {
      navigationRef.navigate('ReflectionUnlock', { appId: pendingAppId.current });
      pendingAppId.current = null;
    }
  };

  if (!hydrated) return null;

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} onReady={onReady}>
      <Stack.Navigator
        initialRouteName={state.hasOnboarded ? 'Dashboard' : 'Onboarding'}
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.ink, fontSize: 17, fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AppPicker" component={AppPickerScreen} options={{ title: '' }} />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={({ navigation }) => ({
            title: 'Gatie',
            headerBackVisible: false,
            headerRight: () => (
              <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.headerAction}>Settings</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="ReflectionUnlock"
          component={ReflectionUnlockScreen}
          options={{ title: '', presentation: 'modal' }}
        />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerAction: { color: colors.primary, fontSize: 16, fontWeight: '500' },
});
