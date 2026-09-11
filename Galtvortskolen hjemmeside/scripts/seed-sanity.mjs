import { createClient } from '@sanity/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SANITY_PROJECT_ID: projectId, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token)
  throw new Error('Legg SANITY_PROJECT_ID og SANITY_WRITE_TOKEN i .env før import.');
const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || 'production',
  token,
  apiVersion: '2026-01-01',
  useCdn: false,
});
const content = JSON.parse(await readFile(path.join(root, 'src/lib/content.json'), 'utf8'));
const assets = new Map();
async function transform(value) {
  if (Array.isArray(value)) return Promise.all(value.map(transform));
  if (!value || typeof value !== 'object') return value;
  if (value.url?.startsWith('/images/')) {
    if (!assets.has(value.url)) {
      assets.set(
        value.url,
        client.assets.upload('image', await readFile(path.join(root, 'public', value.url)), {
          filename: path.basename(value.url),
        }),
      );
    }
    const asset = await assets.get(value.url);
    return { _type: 'image', alt: value.alt, asset: { _type: 'reference', _ref: asset._id } };
  }
  const output = {};
  for (const [key, child] of Object.entries(value))
    output[key] = key === 'slug' ? { _type: 'slug', current: child } : await transform(child);
  return output;
}
// Skip existing documents before uploading assets. Never overwrite editorial work.
for (const document of [content.settings, content.home, ...content.events, ...content.pages]) {
  if (await client.getDocument(document._id)) {
    console.log(`Beholder eksisterende: ${document._id}`);
    continue;
  }
  await client.createIfNotExists(await transform(document));
  console.log(`Importert: ${document._id}`);
}
console.log('Startinnhold er importert. Kjør npm run build for å hente det til nettsiden.');
