import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fr } from '@/i18n/fr';
import { space } from '@/theme';

import { AppText } from './app-text';

type Props = {
  visible: boolean;
  source: ImageSource | number | null;
  caption?: string;
  onClose: () => void;
};

const MAX_SCALE = 5;

/** Full-screen photo: pinch to zoom, drag when zoomed, double-tap to toggle zoom. */
export function PhotoViewer({ visible, source, caption, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const reset = () => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomed = scale.value > 1;
      scale.value = withTiming(zoomed ? 1 : 2.5);
      savedScale.value = zoomed ? 1 : 2.5;
      tx.value = withTiming(0);
      ty.value = withTiming(0);
      savedTx.value = 0;
      savedTy.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <Animated.View style={[styles.flex, animatedStyle]}>
            {source != null ? (
              <Image
                source={source}
                style={styles.flex}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            ) : null}
          </Animated.View>
        </GestureDetector>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fr.common.close}
          onPress={close}
          hitSlop={12}
          style={[styles.close, { top: insets.top + space.md }]}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>

        {caption ? (
          <View style={[styles.caption, { paddingBottom: insets.bottom + space.lg }]}>
            <AppText variant="caption" style={styles.captionText}>
              {caption}
            </AppText>
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  flex: { flex: 1 },
  close: {
    position: 'absolute',
    right: space.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  captionText: { color: '#fff', textAlign: 'center' },
});
