import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SwipeableTab } from '@/components/swipeable-tab';
import { fr } from '@/i18n/fr';
import { fonts, useTheme } from '@/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    // The gesture handler root is needed for the tab swipe gesture (none higher in the tree).
    <GestureHandlerRootView style={styles.flex}>
      <Tabs
        // Each tab screen is wrapped once here, so the 3 screens stay unaware of the swipe.
        screenLayout={({ route, navigation, children }) => (
          <SwipeableTab routeKey={route.key} navigation={navigation}>
            {children}
          </SwipeableTab>
        )}
        screenOptions={{
          headerShown: false,
          // Directional slide + fade when switching tabs (tap or swipe).
          animation: 'shift',
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: fr.tabs.home,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="catalog"
          options={{
            title: fr.tabs.catalog,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: fr.tabs.settings,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
