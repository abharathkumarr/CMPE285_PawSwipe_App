import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AppUser } from './types';

const USER_KEY = 'pawswipe_user';

async function read(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(USER_KEY);
  }
  try {
    return await SecureStore.getItemAsync(USER_KEY);
  } catch {
    return AsyncStorage.getItem(USER_KEY);
  }
}

async function write(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(USER_KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(USER_KEY, value);
  } catch {
    await AsyncStorage.setItem(USER_KEY, value);
  }
}

export async function getStoredUser(): Promise<AppUser | null> {
  const raw = await read();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: AppUser): Promise<void> {
  await write(JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(USER_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    await AsyncStorage.removeItem(USER_KEY);
  }
}
