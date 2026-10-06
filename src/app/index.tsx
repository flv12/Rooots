import { StyleSheet, Text, View } from 'react-native';

import { fr } from '@/i18n/fr';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="text">{fr.home.placeholder}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
