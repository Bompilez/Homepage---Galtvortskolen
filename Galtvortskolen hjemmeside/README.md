# Galtvortskolen

Nettside for Galtvortskolen, bygget med Astro og Sanity.

## Kom i gang lokalt

Bruk Node 22.19 eller nyere.

```sh
npm install
npm run dev
```

Åpne http://localhost:4321.

Rediger sidene i `src/pages/` og komponentene i `src/components/`. Stiler ligger i
`src/styles/`, og JavaScript for komponentene ligger i `src/scripts/`. Astro bygger
`dist/index.html` og de andre HTML-filene automatisk; de er ikke kildefiler som skal redigeres.

Discord-invitasjonen legges inn under Innstillinger i Sanity når lenken er klar.

Hvis Sanity ikke er satt opp ennå, bruker siden lokalt demo-innhold fra `src/lib/content.json`.

## Viktige kommandoer

```sh
npm run dev
npm run build
npm run preview
npm run check
npm run studio
```

- `npm run dev` starter nettsiden lokalt.
- `npm run build` bygger produksjonsversjonen.
- `npm run preview` viser bygget lokalt.
- `npm run studio` starter Sanity Studio på http://localhost:3333.

## Miljøvariabler

Kopier `.env.example` til `.env` når Sanity skal brukes.

```env
SANITY_PROJECT_ID=
SANITY_DATASET=production
PUBLIC_SANITY_STUDIO_URL=
```

`SANITY_WRITE_TOKEN` brukes bare lokalt ved import av startinnhold. Den skal ikke legges i Git.

## Sanity

Sanity brukes for å redigere innhold som forside, informasjonssider, arrangementer, team og huscup.

Kort oppsett:

1. Opprett et Sanity-prosjekt.
2. Sett `SANITY_PROJECT_ID` i `.env`.
3. Sett samme prosjekt-ID i `studio/.env`.
4. Kjør `npm run cms:seed` hvis startinnhold skal importeres.
5. Kjør `npm run studio` for å redigere innhold.

## Publisering

Prosjektet er klargjort for Netlify.

Netlify skal bruke:

```txt
Base directory: Galtvortskolen hjemmeside
Build command: npm run build
Publish directory: dist
Node version: 22.22.0
```

Dette ligger også i `netlify.toml`.

Legg disse miljøvariablene inn i Netlify:

```env
SANITY_PROJECT_ID=
SANITY_DATASET=production
PUBLIC_SANITY_STUDIO_URL=
```

Når innhold endres i Sanity, kan Netlify bygges på nytt med en Build Hook.

## Notater

- Nettsiden bygges som statiske filer.
- Huscup-poeng kan oppdatere seg fra Sanity i nettleseren.
- Se `SOURCES.md` for hvor startinnhold og bilder kommer fra.
