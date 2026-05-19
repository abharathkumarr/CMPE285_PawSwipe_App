import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export function SetupScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🐾</Text>
      <Text style={styles.title}>Connect Supabase</Text>
      <Text style={styles.body}>
        1. Create a project at supabase.com{'\n'}
        2. Run SQL migrations 001–005 from supabase/migrations{'\n'}
        3. Add a .env file with your Supabase keys{'\n'}
        4. npm install && npm run seed && npm run seed-demo-votes{'\n'}
        5. npx expo start --clear
      </Text>
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
});
