import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import { REPEAT, repeatDelay } from './repeat-delay';

type Props = {
  icon: 'add' | 'remove';
  accessibilityLabel: string;
  disabled?: boolean;
  /** Called once per step; must use functional state updates (it fires from timers). */
  onStep: () => void;
};

/** Tap = one step. Hold = repeats, faster and faster. */
export function RepeatButton({ icon, accessibilityLabel, disabled, onStep }: Props) {
  const { colors } = useTheme();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => stop, []);

  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);

  const step = () => {
    onStepRef.current();
    Haptics.selectionAsync().catch(() => {});
  };

  const start = () => {
    step();
    let n = 0;
    const tick = () => {
      step();
      timer.current = setTimeout(tick, repeatDelay(++n));
    };
    timer.current = setTimeout(tick, REPEAT.holdMs);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={start}
      onPressOut={stop}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.primarySoft,
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
