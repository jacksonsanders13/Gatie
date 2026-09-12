import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';

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
        screenOptions={{ headerShadowVisible: false, headerTintColor: colors.primary, headerTitleStyle: { color: colors.ink } }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AppPicker" component={AppPickerScreen} options={{ title: 'Apps to block' }} />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={({ navigation }) => ({
            title: 'Gatie',
            headerBackVisible: false,
            headerRight: () => (
              <Pressable accessibilityRole="button" hitSlop={10} onPress={() => navigation.navigate('Settings')}>
                <Text style={{ color: colors.primary, fontSize: 17 }}>Settings</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="ReflectionUnlock"
          component={ReflectionUnlockScreen}
          options={{ title: 'Before you go in', presentation: 'modal' }}
        />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
