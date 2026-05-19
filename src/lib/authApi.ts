import { getSupabase } from './supabase';
import type { AppUser } from './types';

export async function loginWithEmail(email: string, password: string): Promise<AppUser> {
  const { data, error } = await getSupabase().rpc('login_user', {
    p_email: email.trim(),
    p_password: password,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) {
    throw new Error('Invalid email or password');
  }

  return {
    id: row.id as string,
    email: row.email as string,
    username: row.username as string,
  };
}

export async function registerWithEmail(
  email: string,
  password: string,
  username: string
): Promise<AppUser> {
  const { data, error } = await getSupabase().rpc('register_user', {
    p_email: email.trim(),
    p_password: password,
    p_username: username.trim(),
  });

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new Error('Email or username already taken');
    }
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) {
    throw new Error('Could not create account');
  }

  return {
    id: row.id as string,
    email: row.email as string,
    username: row.username as string,
  };
}
