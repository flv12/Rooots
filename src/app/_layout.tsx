import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, type ReactNode } from 'react';

import { ToastProvider } from '@/components/toast';
import { migrate } from '@/db/migrations';
import { useReminderSync } from '@/notifications/use-reminder-sync';
import { fr } from '@/i18n/fr';
import { PlantsStoreProvider } from '@/store/plants-store';
import { fonts, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const [loaded, error] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.bg,
      card: colors.bg,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <SQLiteProvider databaseName="plants.db" onInit={migrate}>
        <PersistentStore>
          <ToastProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
                headerBackButtonDisplayMode: 'minimal',
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="catalog/[id]" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen
                name="plant/[id]/index"
                options={{ title: '', headerTransparent: true }}
              />
              <Stack.Screen
                name="plant/new"
                options={{ title: fr.form.newTitle, presentation: 'modal' }}
              />
              <Stack.Screen
                name="plant/[id]/edit"
                options={{ title: fr.form.editTitle, presentation: 'modal' }}
              />
              <Stack.Screen name="credits" options={{ title: fr.credits.title }} />
            </Stack>
          </ToastProvider>
        </PersistentStore>
      </SQLiteProvider>
    </ThemeProvider>
  );
}

function PersistentStore({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  return (
    <PlantsStoreProvider db={db}>
      <ReminderSync />
      {children}
    </PlantsStoreProvider>
  );
}

function ReminderSync() {
  useReminderSync();
  return null;
}
