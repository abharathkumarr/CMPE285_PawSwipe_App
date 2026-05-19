/**
 * Regenerates supabase/seed/items.json with dog & cat photos.
 * Usage: node scripts/generate-items.mjs && npm run seed
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../supabase/seed/items.json');

const FETCH_OPTS = {
  headers: { 'User-Agent': 'PawSwipe/1.0 (education project)' },
};

const DOG_COUNT = 60;
const CAT_COUNT = 50;

const dogNames = ['Buddy', 'Max', 'Charlie', 'Cooper', 'Luna', 'Bella', 'Daisy'];
const catNames = ['Luna', 'Bella', 'Mittens', 'Shadow', 'Oliver', 'Cleo'];
const personalities = [
  'Loves belly rubs',
  'Expert napper',
  'Zoomies enthusiast',
  'Gentle with kids',
  'Treat motivated',
];

function breedFromDogUrl(url) {
  try {
    const part = url.split('/breeds/')[1];
    if (!part) return 'Mixed Breed';
    return part
      .split('/')[0]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  } catch {
    return 'Mixed Breed';
  }
}

async function fetchDogBatch(count) {
  const urls = [];
  for (let i = 0; i < count; i++) {
    const res = await fetch('https://dog.ceo/api/breeds/image/random', FETCH_OPTS);
    const json = await res.json();
    if (json.message) urls.push(json.message);
    await new Promise((r) => setTimeout(r, 120));
  }
  return urls;
}

async function fetchCatBatch(count) {
  const urls = [];
  while (urls.length < count) {
    const need = Math.min(10, count - urls.length);
    const res = await fetch(
      `https://api.thecatapi.com/v1/images/search?limit=${need}&size=med`,
      FETCH_OPTS
    );
    const json = await res.json();
    for (const img of json) {
      if (img.url) urls.push(img.url);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return urls.slice(0, count);
}

console.log('Fetching dog photos…');
const dogUrls = await fetchDogBatch(DOG_COUNT);
console.log('Fetching cat photos…');
const catUrls = await fetchCatBatch(CAT_COUNT);

const items = [];

for (let i = 0; i < dogUrls.length; i++) {
  const id = `pet-${String(i + 1).padStart(3, '0')}`;
  items.push({
    id,
    label: `${dogNames[i % dogNames.length]} · ${breedFromDogUrl(dogUrls[i])}`,
    description: `${personalities[i % personalities.length]}. Looking for a forever home.`,
    image_url: dogUrls[i],
  });
}

for (let i = 0; i < catUrls.length; i++) {
  const idx = dogUrls.length + i;
  const id = `pet-${String(idx + 1).padStart(3, '0')}`;
  items.push({
    id,
    label: `${catNames[i % catNames.length]} · Rescue Cat`,
    description: `${personalities[(idx + 2) % personalities.length]}. Looking for a forever home.`,
    image_url: catUrls[i],
  });
}

writeFileSync(OUT, JSON.stringify(items, null, 2));
console.log(`Wrote ${items.length} items to ${OUT}`);
