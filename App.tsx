import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { checkPro, initPurchases } from './src/services/purchases';
import { setPro } from './src/state/actions';
import { StoreProvider, useStore } from './src/state/store';

function EntitlementSync() {
  const { update } = useStore();

  useEffect(() => {
    initPurchases()
      .then(checkPro)
      .then((isPro) => {
        if (isPro != null) update((s) => setPro(s, isPro));
      })
      .catch((e) => console.warn('Failed to sync entitlement', e));
  }, [update]);

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <EntitlementSync />
        <RootNavigator />
        <StatusBar style="dark" />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
