import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui';
import type { ScreenProps } from '../navigation/types';
import { colors, space, type } from '../theme';

// One idea per page, straight from the positioning.
const PAGES = [
  {
    eyebrow: 'Why Gatie',
    title: 'Blocks you. Then makes you think.',
    body:
      'Other apps make you reflect — if you remember to open them. Other apps block you — then let you through with a tap. Gatie does both: it locks the app, and won’t let you back in until you’ve written down why.',
  },
  {
    eyebrow: 'How you get back in',
    title: 'Not a timer. A reason.',
    body:
      'You write why you want it, and one reason you don’t. That’s the part research shows works: a passive delay didn’t reduce impulse buying, because people kept browsing while they waited. A short, active reflection did.',
  },
  {
    eyebrow: 'Private by design',
    title: 'Nothing leaves your phone.',
    body:
      'No bank account to link. No account to create. No spending data sent anywhere. Just a gate between you and the apps that get you.',
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
      <View style={styles.brandRow}>
        <View style={styles.mark} />
        <Text style={styles.brand}>Gatie</Text>
      </View>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {PAGES.map((p) => (
          <View key={p.title} style={[styles.page, { width }]}>
            <Text style={type.overline}>{p.eyebrow}</Text>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.body}>{p.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button label={last ? 'Choose what to lock' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
  mark: { width: 10, height: 20, borderRadius: 2, backgroundColor: colors.primary },
  brand: { fontSize: 17, fontWeight: '600', letterSpacing: 0.2, color: colors.ink },
  page: { paddingHorizontal: space.xl, justifyContent: 'center', gap: space.md },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8, color: colors.ink },
  body: { fontSize: 17, lineHeight: 26, color: colors.inkSoft },
  footer: { paddingHorizontal: space.xl, paddingBottom: space.md, gap: space.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lineStrong },
  dotActive: { width: 20, backgroundColor: colors.primary },
});
