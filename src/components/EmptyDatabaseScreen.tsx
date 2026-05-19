import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  onRetry: () => void;
}

export function EmptyDatabaseScreen({ onRetry }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>📭</Text>
      <Text style={styles.title}>No pets in database yet</Text>
      <Text style={styles.body}>
        Run on your Mac: npm run seed (and npm run generate-items if needed). Then tap Retry.
      </Text>
      <Pressable style={styles.btn} onPress={onRetry}>
        <Text style={styles.btnText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
    gap: 12,
  },
  emoji: { fontSize: 48, textAlign: 'center' },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  btn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: {
    color: colors.bg,
    fontWeight: '800',
    fontSize: 16,
  },
});
