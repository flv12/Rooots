import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { careDate } from '@/domain/care-date';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';
import { fonts, radius, space, useTheme } from '@/theme';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Add a note to a plant, or edit one (`noteId`). */
export default function PlantNoteScreen() {
  const { id, noteId } = useLocalSearchParams<{ id: string; noteId?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { plants, notes, saveNote } = usePlantsStore();
  const plant = plants.find((p) => p.id === id);
  const existing = noteId ? notes.find((n) => n.id === noteId) : undefined;
  const [body, setBody] = useState(existing?.body ?? '');
  const [notedAt, setNotedAt] = useState(existing?.notedAt ?? new Date().toISOString());

  if (!plant || (noteId && !existing)) {
    return <EmptyState icon="leaf-outline" title={fr.plant.notFound} />;
  }

  const pickDate = () =>
    DateTimePickerAndroid.open({
      value: new Date(notedAt),
      mode: 'date',
      maximumDate: new Date(),
      // Same rule as care dates: a past day is kept at noon, today keeps the current time.
      onValueChange: (_event, date) => setNotedAt(careDate(date, new Date()).toISOString()),
    });

  const text = body.trim();
  const submit = () => {
    if (!text) return;
    saveNote({ id: existing?.id ?? newId(), plantId: plant.id, body: text, notedAt });
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <Stack.Screen options={{ title: existing ? fr.notes.editTitle : fr.notes.addTitle }} />
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <AppText variant="label" color="textMuted">
            {fr.notes.date.toUpperCase()}
          </AppText>
          <View style={styles.row}>
            <Chip
              icon="calendar-outline"
              label={format(new Date(notedAt), 'EEEE d MMMM yyyy', { locale: frLocale })}
              onPress={pickDate}
            />
          </View>
        </View>
        <View style={styles.field}>
          <AppText variant="label" color="textMuted">
            {fr.notes.text.toUpperCase()}
          </AppText>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={fr.notes.placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus={!existing}
            accessibilityLabel={fr.notes.text}
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
          />
        </View>
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
        <Button label={fr.form.save} icon="checkmark" size="lg" disabled={!text} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.xl },
  field: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: {
    minHeight: 140,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlignVertical: 'top',
  },
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
