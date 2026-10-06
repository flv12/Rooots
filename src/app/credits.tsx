import { ScrollView, StyleSheet, View } from 'react-native';

import { catalogDisplayName, catalogPlants } from '@/catalog';
import { AppText } from '@/components/app-text';
import { Card, SectionTitle } from '@/components/section';
import { fr } from '@/i18n/fr';
import { space, useTheme } from '@/theme';

export default function CreditsScreen() {
  const { colors } = useTheme();
  const withPhotos = catalogPlants.filter((p) => p.photos.length > 0);
  const sources = [
    ...new Map(catalogPlants.flatMap((p) => p.sources).map((s) => [s.name, s])).values(),
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <AppText color="textMuted">{fr.credits.intro}</AppText>

      <SectionTitle>{fr.credits.photos}</SectionTitle>
      <Card>
        {withPhotos.length === 0 ? (
          <AppText color="textMuted">{fr.credits.noPhotos}</AppText>
        ) : (
          withPhotos.map((p) => (
            <View key={p.id} style={styles.item}>
              <AppText variant="bodyMedium">{catalogDisplayName(p)}</AppText>
              {p.photos.map((ph) => (
                <AppText key={ph.file} variant="caption" color="textMuted">
                  {ph.author} · {ph.license} · {ph.source_url}
                </AppText>
              ))}
            </View>
          ))
        )}
      </Card>

      <SectionTitle>{fr.credits.data}</SectionTitle>
      <Card>
        {sources.map((s) => (
          <View key={s.name} style={styles.item}>
            <AppText variant="bodyMedium">{s.name}</AppText>
            {s.url ? (
              <AppText variant="caption" color="textMuted">
                {s.url}
              </AppText>
            ) : null}
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl },
  item: { paddingVertical: space.xs, gap: 2 },
});
