import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogDisplayName, type CatalogPlant } from '@/catalog';
import { defaultPlantName } from '@/catalog/default-name';
import { seasonOf } from '@/domain/season';
import { fr } from '@/i18n/fr';
import type { NewPlant } from '@/store/plants-store';
import { fonts, radius, space, useTheme } from '@/theme';

import { AppText } from './app-text';
import { Button } from './button';
import { Chip } from './chip';
import { PlantAvatar } from './plant-avatar';
import { RepeatButton } from './repeat-button';

type Props = {
  initial: NewPlant;
  catalog?: CatalogPlant;
  submitLabel: string;
  onSubmit: (values: NewPlant) => void | Promise<void>;
};

const MIN_DAYS = 1;
const MAX_DAYS = 60;

export function PlantForm({ initial, catalog, submitLabel, onSubmit }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<NewPlant>(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof NewPlant>(key: K, value: NewPlant[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const seasonal = catalog != null && values.waterEveryDays == null;
  const currentCatalogDays = catalog
    ? seasonOf(new Date()) === 'summer'
      ? catalog.water_every_days_summer
      : catalog.water_every_days_winter
    : 7;
  const days = values.waterEveryDays ?? currentCatalogDays;

  // Functional update: called repeatedly from timers while the button is held.
  const stepDays = (delta: number) =>
    setValues((v) => {
      const current = v.waterEveryDays ?? currentCatalogDays;
      const next = Math.min(MAX_DAYS, Math.max(MIN_DAYS, current + delta));
      return { ...v, waterEveryDays: next };
    });

  const pickPhoto = async (source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) set('photoPath', result.assets[0].uri);
  };

  // Optional nickname: defaults to the plant's usual name (« Monstera », not the latin name).
  const fallbackName = defaultPlantName(catalog, values.species);

  const submit = async () => {
    if (saving) return;
    const name = values.name.trim() || fallbackName;
    setSaving(true);
    try {
      await onSubmit({
        ...values,
        name,
        species: values.species?.trim() || null,
        notes: values.notes?.trim() || null,
        location: values.location?.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoRow}>
          <PlantAvatar
            seed={catalog?.id ?? values.name ?? 'new'}
            photoPath={values.photoPath}
            catalogId={catalog?.id}
            size={104}
            rounded={radius.lg}
          />
          <View style={styles.photoActions}>
            {catalog ? (
              <View>
                <AppText variant="heading">{catalogDisplayName(catalog)}</AppText>
                <AppText variant="latin" color="textMuted">
                  {catalog.latin_name}
                </AppText>
              </View>
            ) : null}
            <View style={styles.photoButtons}>
              <Chip
                icon="camera-outline"
                label={fr.form.takePhoto}
                onPress={() => pickPhoto('camera')}
              />
              <Chip
                icon="images-outline"
                label={fr.form.fromLibrary}
                onPress={() => pickPhoto('library')}
              />
            </View>
          </View>
        </View>

        <Field label={fr.form.name}>
          <Input
            value={values.name}
            onChangeText={(t) => set('name', t)}
            placeholder={catalog ? fallbackName : fr.form.namePlaceholder}
            returnKeyType="done"
          />
          <AppText variant="caption" color="textMuted">
            {fr.form.nameHint(fallbackName)}
          </AppText>
        </Field>

        {!catalog ? (
          <Field label={fr.form.species}>
            <Input
              value={values.species ?? ''}
              onChangeText={(t) => set('species', t)}
              placeholder={fr.form.speciesPlaceholder}
            />
          </Field>
        ) : null}

        <Field label={fr.form.location}>
          <View style={styles.chips}>
            {fr.form.locations.map((loc) => (
              <Chip
                key={loc}
                label={loc}
                selected={values.location === loc}
                onPress={() => set('location', values.location === loc ? null : loc)}
              />
            ))}
          </View>
        </Field>

        <Field label={fr.form.frequency}>
          {catalog ? (
            <View style={styles.chips}>
              <Chip
                icon="partly-sunny-outline"
                label={fr.form.useSeason}
                selected={seasonal}
                onPress={() => set('waterEveryDays', null)}
              />
              <Chip
                icon="options-outline"
                label={fr.form.custom}
                selected={!seasonal}
                onPress={() => set('waterEveryDays', currentCatalogDays)}
              />
            </View>
          ) : null}
          <View
            style={[
              styles.stepper,
              { backgroundColor: colors.surface, borderColor: colors.border },
              seasonal && styles.dimmed,
            ]}
          >
            <RepeatButton
              icon="remove"
              accessibilityLabel="-1 jour"
              disabled={seasonal || days <= MIN_DAYS}
              onStep={() => stepDays(-1)}
            />
            <View style={styles.stepperValue}>
              <Ionicons name="water" size={18} color={colors.water} />
              <AppText variant="heading">{fr.everyDays(days)}</AppText>
            </View>
            <RepeatButton
              icon="add"
              accessibilityLabel="+1 jour"
              disabled={seasonal || days >= MAX_DAYS}
              onStep={() => stepDays(1)}
            />
          </View>
          {catalog ? (
            <AppText variant="caption" color="textMuted">
              {fr.form.frequencyHint(
                catalog.water_every_days_summer,
                catalog.water_every_days_winter,
              )}
            </AppText>
          ) : null}
        </Field>

        <Field label={fr.form.notes}>
          <Input
            value={values.notes ?? ''}
            onChangeText={(t) => set('notes', t)}
            placeholder={fr.form.notesPlaceholder}
            multiline
            style={styles.multiline}
          />
        </Field>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + space.md,
            backgroundColor: colors.bg,
            borderColor: colors.border,
          },
        ]}
      >
        <Button label={submitLabel} icon="checkmark" size="lg" disabled={saving} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText variant="label" color="textMuted">
        {label.toUpperCase()}
      </AppText>
      {children}
      {error ? (
        <AppText variant="caption" color="overdue">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function Input(props: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[
        styles.input,
        { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.xl },
  photoRow: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  photoActions: { flex: 1, gap: space.md },
  photoButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  field: { gap: space.sm },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  multiline: { minHeight: 96, paddingTop: space.md, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dimmed: { opacity: 0.6 },
  stepperValue: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
