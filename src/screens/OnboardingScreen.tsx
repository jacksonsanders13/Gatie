import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui';
import type { ScreenProps } from '../navigation/types';
import { colors, type } from '../theme';

// One idea per page, straight from the positioning copy.
const PAGES = [
  {
    eyebrow: 'Why Gatie',
    title: 'Blocks you. Then makes you think.',
    body:
      'Other apps make you reflect — if you remember to open them. Other apps block you — then let you through with a tap. Gatie does both: it locks the app, and won’t let you back in until you’ve actually written down why.',
  },
  {
    eyebrow: 'How you get back in',
    title: 'Not a timer. A reason.',
    body:
      'To get back in, you write why you want it — and one reason you don’t. That’s the part research shows works: a passive delay didn’t reduce impulse buying at all, because people just kept browsing while they waited. A short, active reflection did.',
  },
  {
    eyebrow: 'Private by design',
    title: 'Nothing leaves your phone.',
    body:
      'No bank account to link. No account to create. No spending data sent anywhere. Just a gate between you and the apps that get you — and a real reason to walk through it.',
  },
];

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const next = () => {
    if (last) {
      navigation.navigate('AppPicker', { fromOnboarding: true });
      return;
    }
    scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.brand}>Gatie</Text>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {PAGES.map((p) => (
          <View key={p.title} style={[styles.page, { width }]}>
            <Text style={styles.eyebrow}>{p.eyebrow}</Text>
            <Text style={type.display}>{p.title}</Text>
            <Text style={[type.body, styles.body]}>{p.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button label={last ? 'Choose apps to block' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  brand: { ...type.title, color: colors.primary, paddingHorizontal: 28, paddingTop: 12 },
  page: { paddingHorizontal: 28, justifyContent: 'center', gap: 16 },
  eyebrow: { ...type.caption, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  body: { fontSize: 18, lineHeight: 27, color: colors.muted },
  footer: { paddingHorizontal: 28, paddingBottom: 12, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.primary, width: 22 },
});
