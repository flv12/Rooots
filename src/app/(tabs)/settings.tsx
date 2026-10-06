import Ionicons from '@expo/vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Card, SectionTitle } from '@/components/section';
import { useToast } from '@/components/toast';
import { fr } from '@/i18n/fr';
import { ensurePermission, sendTestReminder } from '@/notifications';
import { usePlantsStore } from '@/store/plants-store';
import { usePlantViews } from '@/store/use-plant-views';
import { radius, space, useTheme } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { loadDemo, clearAll, settings, updateSettings } = usePlantsStore();
  const toast = useToast();
  const views = usePlantViews();

  const testReminder = async () => {
    const names = views.filter((v) => v.status.kind !== 'upcoming').map((v) => v.plant.name);
    try {
      const ok = await sendTestReminder(names);
      toast.show({
        message: ok
          ? 'Notification envoyée dans 5 secondes'
          : 'Autorisez les notifications dans les réglages Android',
      });
    } catch (e) {
      toast.show({ message: `Échec de la notification : ${(e as Error).message}` });
    }
  };
  const enabled = settings.remindersEnabled;
  const timeLabel = `${pad(settings.reminderHour)}:${pad(settings.reminderMinute)}`;

  const pickTime = () => {
    const value = new Date();
    value.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);
    DateTimePickerAndroid.open({
      value,
      mode: 'time',
      is24Hour: true,
      onValueChange: (_event, date) => {
        updateSettings({ reminderHour: date.getHours(), reminderMinute: date.getMinutes() });
        toast.show({
          message: `Rappel programmé à ${pad(date.getHours())}:${pad(date.getMinutes())}`,
        });
      },
    });
  };

  const confirm = (title: string, body: string, action: () => void, done: string) =>
    Alert.alert(title, body, [
      { text: fr.plant.cancel, style: 'cancel' },
      {
        text: title,
        style: 'destructive',
        onPress: () => {
          action();
          toast.show({ message: done });
        },
      },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
    >
      <AppText variant="display" accessibilityRole="header">
        {fr.settings.title}
      </AppText>

      <SectionTitle>{fr.settings.reminders}</SectionTitle>
      <Card>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <AppText variant="bodyMedium">{fr.settings.remindersOn}</AppText>
            <AppText variant="caption" color="textMuted">
              {fr.settings.remindersHint}
            </AppText>
          </View>
          <Switch
            value={enabled}
            onValueChange={(v) => {
              updateSettings({ remindersEnabled: v });
              if (v)
                ensurePermission()
                  .then((ok) => {
                    if (!ok)
                      toast.show({
                        message: 'Autorisez les notifications dans les réglages Android',
                      });
                  })
                  .catch(() => {});
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel={fr.settings.remindersOn}
          />
        </View>
        {enabled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${fr.settings.time} : ${timeLabel}`}
            onPress={pickTime}
            style={({ pressed }) => [
              styles.time,
              { backgroundColor: colors.primarySoft, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="alarm-outline" size={26} color={colors.primary} />
            <View style={styles.flex}>
              <AppText variant="caption" color="textMuted">
                {fr.settings.time}
              </AppText>
              <AppText variant="display" color="primary">
                {timeLabel}
              </AppText>
            </View>
            <AppText variant="bodyMedium" color="primary">
              Modifier
            </AppText>
          </Pressable>
        ) : null}
      </Card>

      <View style={styles.gap} />
      <Card padded={false}>
        <Row
          icon="notifications-outline"
          label="Tester le rappel"
          hint="Envoie le récapitulatif du jour dans 5 secondes."
          onPress={testReminder}
        />
      </Card>

      <SectionTitle>{fr.settings.data}</SectionTitle>
      <Card padded={false}>
        <Row
          icon="leaf-outline"
          label={fr.settings.loadDemo}
          hint={fr.settings.loadDemoHint}
          onPress={() =>
            confirm(
              fr.settings.loadDemo,
              fr.settings.loadDemoHint,
              loadDemo,
              'Plantes d’exemple chargées',
            )
          }
        />
        <Row
          icon="trash-outline"
          label={fr.settings.clearAll}
          hint={fr.settings.clearAllHint}
          onPress={() =>
            confirm(
              fr.settings.clearAll,
              fr.settings.clearAllConfirm,
              clearAll,
              'Toutes les plantes ont été effacées',
            )
          }
        />
      </Card>

      <SectionTitle>{fr.settings.about}</SectionTitle>
      <Card padded={false}>
        <Row
          icon="ribbon-outline"
          label={fr.settings.credits}
          chevron
          onPress={() => router.push('/credits')}
        />
        <Row
          icon="information-circle-outline"
          label={fr.settings.version}
          trailing={<AppText color="textMuted">{Constants.expoConfig?.version ?? '—'}</AppText>}
        />
      </Card>
    </ScrollView>
  );
}

type RowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  onPress?: () => void;
  chevron?: boolean;
  trailing?: ReactNode;
};

function Row({ icon, label, hint, onPress, chevron, trailing }: RowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyMedium">{label}</AppText>
        {hint ? (
          <AppText variant="caption" color="textMuted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { height: space.md },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
