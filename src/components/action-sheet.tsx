import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fr } from '@/i18n/fr';
import { radius, space, useTheme } from '@/theme';

import { AppText } from './app-text';
import { Button } from './button';

export type SheetAction = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  actions: SheetAction[];
  onClose: () => void;
};

/** Bottom sheet with any number of actions and an explicit cancel button (Android alerts cap at 3 buttons). */
export function ActionSheet({ visible, title, actions, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={fr.plant.cancel} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, paddingBottom: insets.bottom + space.lg },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              a.onPress();
            }}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={a.icon} size={20} color={colors.primary} />
            </View>
            <AppText variant="bodyMedium">{a.label}</AppText>
          </Pressable>
        ))}
        <Button
          label={fr.plant.cancel}
          variant="secondary"
          onPress={onClose}
          style={styles.cancel}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: space.md },
  title: { marginBottom: space.sm },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cancel: { marginTop: space.md },
});
