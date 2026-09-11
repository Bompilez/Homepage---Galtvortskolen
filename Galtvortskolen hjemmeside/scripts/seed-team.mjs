import { createClient } from '@sanity/client';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const { SANITY_PROJECT_ID: projectId, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Mangler prosjekt-ID eller importtoken i .env.');
const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || 'production',
  token,
  apiVersion: '2026-01-01',
  useCdn: false,
});
const team = JSON.parse(await readFile(new URL('../src/lib/team.json', import.meta.url), 'utf8'));

async function run() {
  if (await client.getDocument(team._id)) {
    console.log('Teamet finnes allerede. Beholder redaktørenes innhold.');
    return;
  }
  for (const member of team.members) {
    member.photos = await Promise.all(
      member.photos.map(async (photo) => {
        const file = new URL('../public' + photo.url, import.meta.url);
        const asset = await client.assets.upload('image', await readFile(file), {
          filename: fileURLToPath(file).split('/').pop(),
        });
        return {
          _key: photo._key,
          _type: 'image',
          alt: photo.alt,
          asset: { _type: 'reference', _ref: asset._id },
        };
      }),
    );
    console.log('Klargjort bilder:', member.name);
  }
  await client.createIfNotExists(team);
  console.log('Importert', team.members.length, 'teammedlemmer til Sanity.');
}
try {
  await run();
} catch (error) {
  console.error('Teamimport feilet:', error.statusCode || error.code || 'ukjent feil');
  process.exitCode = 1;
}
