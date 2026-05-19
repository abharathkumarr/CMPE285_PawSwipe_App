import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, layout } from '../src/constants/theme';
import { SetupScreen } from '../src/components/SetupScreen';
import { isSupabaseConfigured } from '../src/lib/supabase';

export default function LoginScreen() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (!loading && user) {
    return <Redirect href="/" />;
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, username);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.wrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.logo}>🐾 PawSwipe</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin' ? 'Sign in with email & password' : 'Create an account'}
        </Text>

        {mode === 'signup' ? (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 chars)"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.primaryText}>
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
        >
          <Text style={styles.switch}>
            {mode === 'signin'
              ? 'New here? Create an account'
              : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: {
    flex: 1,
    paddingHorizontal: layout.horizontalPad,
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  error: {
    color: '#fecaca',
    textAlign: 'center',
    lineHeight: 22,
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: colors.bg,
    fontWeight: '800',
    fontSize: 16,
  },
  switch: {
    color: colors.accent,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
});
