import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const USERS = [
  { email: 'demo@pawswipe.app', password: 'password123', username: 'demo' },
  { email: 'bharath@pawswipe.app', password: 'password123', username: 'bharath' },
];

async function seedUser({ email, password, username }) {
  const { data, error } = await supabase.rpc('register_user', {
    p_email: email,
    p_password: password,
    p_username: username,
  });

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      console.log(`Already exists: ${email} / ${password} (username: ${username})`);
      return;
    }
    throw new Error(`${email}: ${error.message}`);
  }

  console.log(`Created: ${email} / ${password} (username: ${data?.[0]?.username ?? username})`);
}

for (const user of USERS) {
  await seedUser(user);
}

console.log('\nLogin with email + password on the app sign-in screen.');
