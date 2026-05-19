import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const items = JSON.parse(
  readFileSync(join(__dirname, '../supabase/seed/items.json'), 'utf8')
);

const BATCH = 50;
for (let i = 0; i < items.length; i += BATCH) {
  const batch = items.slice(i, i + BATCH);
  const { error } = await supabase.from('items').upsert(batch, { onConflict: 'id' });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Upserted ${Math.min(i + BATCH, items.length)} / ${items.length}`);
}

console.log('Done.');
