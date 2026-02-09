import { StyleSheet } from 'react-native';
import { ThemedText } from '@/src/shared/components/ThemedText';
import { ThemedView } from '@/src/shared/components/ThemedView';

export default function FleetScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Fleet Management</ThemedText>
      <ThemedText style={styles.subtitle}>
        View and manage your fleet vehicles
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    marginTop: 10,
    opacity: 0.7,
  },
});
