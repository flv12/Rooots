import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

import { space, useTheme } from '@/theme';

type Props = { visible: boolean; label: string; onPress: () => void };

const SIZE = 52;
/** Far enough to start fully off-screen on the right (button + margin + shadow). */
const OFFSCREEN = SIZE + space.lg + 24;

/**
 * Slides in from the right edge with a small overshoot: it goes a bit too far left, then settles
 * back slightly to the right. Slides back out to the right when hidden.
 */
export function BackToTopButton({ visible, label, onPress }: Props) {
  const { colors } = useTheme();
  const [x] = useState(() => new Animated.Value(OFFSCREEN));
  const [mounted, setMounted] = useState(visible);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.timing(x, {
        toValue: 0,
        duration: 520,
        // back(): eases out past the target, then comes back to it.
        easing: Easing.out(Easing.back(2.2)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(x, {
        toValue: OFFSCREEN,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, x]);

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateX: x }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.92 : 1 }] },
        ]}
      >
        <Ionicons name="arrow-up" size={24} color={colors.onPrimary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: space.lg, bottom: space.lg },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
