import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** Minimal shape of the tab navigation object we need (avoids coupling to a navigator type). */
type TabNavigation = {
  getState: () => {
    index: number;
    routes: readonly { key: string; name: string; params?: object }[];
  };
  navigate: (name: string, params?: object) => void;
};

type Props = {
  routeKey: string;
  navigation: TabNavigation;
  children: ReactNode;
};

/** The content follows the finger at this ratio: a hint of movement, not a full pager. */
const FOLLOW_RATIO = 0.35;
const MAX_FOLLOW = 80;
/** Rubber band on the first/last tab, where there is nothing to swipe to. */
const EDGE_RATIO = 0.08;
const MAX_EDGE = 24;
const COMMIT_VELOCITY = 600;

/**
 * Lets the user swipe horizontally to the previous/next bottom tab.
 *
 * Why not a real pager: Expo Router's TopTabs needs `react-native-tab-view` +
 * `react-native-pager-view`, which are not installed, and would replace the bottom tab bar.
 * Keeping `Tabs` preserves the tab bar, file-based routes and `router.push('/catalog')`;
 * this wrapper only adds a Pan gesture that calls `navigate` on the tab navigator, and the
 * navigator's `animation: 'shift'` provides the directional transition.
 *
 * Gesture conflicts: the pan only activates after 25 px of horizontal movement and fails
 * after 15 px of vertical movement, so vertical scrolling, taps (FAB, cards, chips) and
 * text inputs keep working. Once a native ScrollView starts scrolling it cancels the pan.
 */
export function SwipeableTab({ routeKey, navigation, children }: Props) {
  const { width } = useWindowDimensions();
  const offset = useSharedValue(0);

  const state = navigation.getState();
  const index = state.routes.findIndex((r) => r.key === routeKey);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < state.routes.length - 1;
  const threshold = Math.min(width * 0.25, 120);

  const goTo = (direction: -1 | 1) => {
    // Re-read the state: it may have changed since render.
    const current = navigation.getState();
    const target = current.routes[current.index + direction];
    if (target) navigation.navigate(target.name, target.params);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      const canGo = e.translationX < 0 ? hasNext : hasPrev;
      const max = canGo ? MAX_FOLLOW : MAX_EDGE;
      const ratio = canGo ? FOLLOW_RATIO : EDGE_RATIO;
      offset.value = Math.max(-max, Math.min(max, e.translationX * ratio));
    })
    .onEnd((e, success) => {
      if (!success) {
        // Cancelled (e.g. a ScrollView took over): snap back.
        offset.value = withSpring(0, { damping: 20, stiffness: 220 });
        return;
      }
      // Swipe left (negative) = next tab, swipe right = previous tab.
      const direction = e.translationX < 0 ? 1 : -1;
      const canGo = direction === 1 ? hasNext : hasPrev;
      const sameDirectionFling = Math.sign(e.velocityX) === -direction;
      const passed =
        Math.abs(e.translationX) > threshold ||
        (sameDirectionFling && Math.abs(e.velocityX) > COMMIT_VELOCITY);

      if (canGo && passed) {
        scheduleOnRN(goTo, direction);
        // The scene fades out with the navigator's shift animation; reset once it is hidden.
        offset.value = withDelay(350, withTiming(0, { duration: 0 }));
      } else {
        offset.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.flex, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
