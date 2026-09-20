import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import AppPickerScreen from '../screens/AppPickerScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PaywallScreen from '../screens/PaywallScreen';
import ReflectionUnlockScreen from '../screens/ReflectionUnlockScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useStore } from '../state/store';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  if (!hydrated) return null;

  return (
    <NavigationContainer theme={navTheme}>
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
