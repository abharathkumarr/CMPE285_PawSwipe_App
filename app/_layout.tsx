import 'react-native-get-random-values';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/constants/theme';
import { isSupabaseConfigured } from '../src/lib/supabase';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return;

    const onLogin = segments[0] === 'login';

    if (!user && !onLogin) {
      router.replace('/login');
    } else if (user && onLogin) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  if (loading && isSupabaseConfigured) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
