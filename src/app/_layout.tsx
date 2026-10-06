import { Stack } from 'expo-router';

import { fr } from '@/i18n/fr';

export default function RootLayout() {
  return <Stack screenOptions={{ title: fr.appName }} />;
}
