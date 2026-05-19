import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and EXPO_PUBLIC_SUPABASE_URL in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const DEMO_VOTERS = 55;
const items = JSON.parse(
  readFileSync(join(__dirname, '../supabase/seed/items.json'), 'utf8')
);

await supabase.from('votes').delete().like('session_id', 'demo-voter-%');

function choiceForItem(itemIndex, voterIndex) {
  if (itemIndex < 25) {
    return (voterIndex + itemIndex) % 5 === 0 ? 'no' : 'yes';
  }
  if (itemIndex < 50) {
    return (voterIndex + itemIndex) % 2 === 0 ? 'yes' : 'no';
  }
  return (voterIndex * 7 + itemIndex * 3) % 10 < 6 ? 'yes' : 'no';
}

const rows = [];
for (let i = 0; i < items.length; i++) {
  const votersForItem = 28 + (i % 12);
  for (let v = 0; v < votersForItem; v++) {
    const voter = v % DEMO_VOTERS;
    rows.push({
      item_id: items[i].id,
      session_id: `demo-voter-${String(voter + 1).padStart(3, '0')}`,
      choice: choiceForItem(i, voter),
      decision_ms: 800 + ((i * 17 + v * 31) % 4000),
    });
  }
}

const BATCH = 200;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase.from('votes').insert(batch);
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  console.log(`Inserted ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
}

console.log(`Done. ${rows.length} demo votes.`);
