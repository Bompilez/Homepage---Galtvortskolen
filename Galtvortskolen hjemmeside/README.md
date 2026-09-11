# Galtvortskolen

Astro-nettside med separat Sanity Studio. Forsiden, opplevelseskortene, informasjonssidene, arrangementene og felles innstillinger kan redigeres i Sanity.

## Lokal start

Bruk Node 22.19 eller nyere (helst nyeste Node 22 LTS) og npm.

```sh
npm install
npm run dev
```

Åpne http://localhost:4321. Uten `SANITY_PROJECT_ID` brukes startinnholdet i `src/lib/content.json`. Dette er en lokal demonstrasjon; endringer er ikke koblet til et CMS før Sanity er konfigurert.

Mens startinnhold importeres, kan `SANITY_LOCAL_PREVIEW=true` brukes i `.env` for å beholde demoen i utviklingsserveren. Sett den til `false` etter import for å se Sanity-innhold. Produksjonsbygg ignorerer denne innstillingen og henter alltid fra det konfigurerte Sanity-prosjektet.

## Koble til Sanity

1. Opprett et prosjekt som heter **Galtvortskolen** på https://www.sanity.io/manage under arrangørenes konto. Opprett et **offentlig dataset** med navn `production`. Datasetet skal bare inneholde nettsidens offentlige tekster og bilder, ikke deltakeropplysninger.
2. Kopier `.env.example` til `.env` og `studio/.env.example` til `studio/.env`.
3. Sett `SANITY_PROJECT_ID` i rotens `.env` og `SANITY_STUDIO_PROJECT_ID` i `studio/.env` til samme prosjekt-ID.
4. I Sanity-prosjektets API-innstillinger: legg til `http://localhost:3333` som CORS-origin med credentials, slik at redaktøren kan logge inn lokalt.
5. Opprett en midlertidig Editor-token i Sanity og legg den **lokalt** i `SANITY_WRITE_TOKEN` i rotens `.env`. Ikke send tokenen i chat eller legg den i Git.
6. Kjør `npm run cms:seed`. Den laster opp de lokale bildene og oppretter startinnhold. Eksisterende dokumenter beholdes. Fjern/revoker tokenen etter import.
7. Kjør `npm run studio`, åpne http://localhost:3333 og logg inn. Kjør `npm run build` for å kontrollere at nettsiden henter innhold fra prosjektet.

Studio bygges med `npm run studio:build` og kan publiseres med `npm run deploy --workspace studio` etter innlogging i Sanity CLI. Sett `PUBLIC_SANITY_STUDIO_URL` til Studio-adressen i nettsidens miljø. Da viser `/admin/` en innloggingslenke. Legg også den publiserte Studio-adressen til som CORS-origin i Sanity.

### Hva redaktørene kan gjøre

- **Forside:** Bytte hovedbilde, overskrifter og beskrivelser, redigere opplevelseskort og endre rekkefølgen på kortene.
- **Arrangementer:** Opprette arrangementer med datoer, pris, frist, bilde, beskrivelse og liste over hva som er inkludert.
- **Informasjonssider:** Redigere tekst og bilder, legge til tekstseksjoner og flytte dem.
- **Innstillinger og påmelding:** Endre toppmelding, påmeldingslenke, sosiale lenker, navn og søkemotorbeskrivelse.

Ny sidestruktur, hovedmeny, knappeetiketter og helt nye typer innholdsseksjoner endres i kode. Hovedmenyens standardadresser bør beholdes. Innholdet i Studio må **publiseres** for å komme med på nettsiden. Visuell forhåndsvisning av upubliserte utkast er ikke satt opp i denne versjonen.

## Publisering og automatisk oppdatering

`netlify.toml` er klargjort for Netlify, men ingen hostingkonto eller produksjonsadresse er koblet til ennå.

1. Koble kildekodens Git-repository til Netlify. Byggkommando: `npm run build`. Publiseringsmappe: `dist`.
2. Legg inn `SANITY_PROJECT_ID`, `SANITY_DATASET` og `PUBLIC_SANITY_STUDIO_URL` som miljøvariabler. Nettsiden trenger ingen API-token når datasetet er offentlig.
3. Opprett en Build Hook i Netlify. Legg URL-en inn som webhook i Sanity med dataset `production`, hendelsene create/update/delete og filter `_type in ["homePage", "siteSettings", "event", "page"] && !(_id in path("drafts.**"))`. Send POST. Hook-URL-en skal ikke inn i Git eller klientkode.
4. Test hele flyten: endre en ufarlig tekst, publiser i Sanity, kontroller vellykket Netlify-bygg og se at endringen kommer på nettsiden.
5. Sett opp en daglig rebuild i hosting/CI for datostyrte endringer: åpne/stengte påmeldinger og kommende/tidligere arrangementer beregnes ved bygging. Skjemaet må uansett selv håndheve påmeldingsfristen.

Et mislykket CMS-kall stopper byggingen. Vi publiserer ikke stille gammelt demoinnhold ved CMS-feil. I Netlify blir siste vellykkede publisering liggende ved byggefeil.

## Kontroller

### Kodestruktur og formatering

- `src/layouts/Layout.astro`: dokumentramme og metadata.
- `src/components/SiteHeader.astro`: toppmelding, navigasjon og mobilmeny.
- `src/components/SiteFooter.astro`: bunntekst.
- `src/pages/`: sidene med lesbar, formatert Astro-markup.
- `src/styles/global.css`: samler stilarkene i riktig rekkefølge.
- `src/styles/base.css`: designvariabler, typografi og felles elementer.
- `src/styles/header.css`, `footer.css`, `home.css` og `pages.css`: stilene for de ulike delene.
- `src/styles/responsive.css`: skjermtilpasninger og redusert bevegelse.

Kjør `npm run format` for automatisk formatering eller `npm run format:check` for å kontrollere den. Prettier med Astro-støtte og `.editorconfig` gir felles innrykk og linjeskift.

```sh
npm run check
npm run build
npm run studio:build
node scripts/check-site.mjs
```

Nettleserkontrollen krever kjørende nettside på port 4321 og Playwright Chromium (`npx playwright install chromium`). Den kontrollerer sider, bilder, interne lenker, mobilmeny, tastatur og horisontal overflow. Skjermbilder lagres i `/tmp`.

## Innhold og gjenstående lanseringsarbeid

Startinnhold og bilder er hentet fra arrangørenes eksisterende nettside 11. september 2026. Aktuelt arrangement: Nyttårsball 8.–10. januar 2027, 3650 kr, frist 1. november 2026. Se `SOURCES.md`.

Før domenet flyttes må arrangørene gå gjennom innholdet og fotografiene. Kontakt, team, leirstøtte og enkelte detaljer lenker foreløpig til den eksisterende nettsiden. Disse sidene må migreres eller få varige adresser før samme domene peker på ny løsning. Den gamle WordPress-nettsiden er ikke endret.

Sanity-innlogging, import, faktisk publiseringswebhook og produksjon er ikke testet mot en ekte konto før prosjekt-ID og tilgang finnes.

Pakkeoverstyringene i `package.json` oppdaterer transitive CLI-avhengigheter med kjente rettelser. Fjern dem når Sanity-avhengighetene selv krever korrigerte versjoner.

## Professorer og team

Om oss viser teamkort i full bredde uten innholdsmenyen. `src/components/Team.astro` og `src/styles/team.css` styrer kort og dialog. Biografier og bildegallerier redigeres under **Professorer og team** i Sanity. Det første bildet brukes på kortet; dra bilder eller personer for å endre rekkefølgen.

Første import: `node --env-file=.env scripts/seed-team.mjs` med en midlertidig Editor-token. Skriptet oppretter bare `teamPage` og bildene, og beholder eksisterende teaminnhold. Før denne importen brukes `src/lib/team.json` som startinnhold. Legg `teamPage` til i webhook-filteret ved offentlig publisering.

Test kort, alle bilder og dialogens tastatur- og mobilbetjening med `node scripts/check-team.mjs`.

## Huscup med poengoppdateringer

På forsiden viser `HouseCup.astro` husenes stilling. Lag en sesong i **Huscup · sesonger og poeng**, legg til poenghendelser i poengloggen og publiser. Hver hendelse har visningsnavn/lag, hus, positivt eller negativt poengbeløp, begrunnelse og tidspunkt. Husenes totaler beregnes fra alle hendelsene. Forsiden viser de åtte nyeste, mens hele loggen beholdes i Sanity. Startpoeng er normalt null og brukes bare ved innføring av en allerede påbegynt sesong. Velg deretter sesongen under **Huscup · aktiv sesong** og publiser valget. Uten en valgt, publisert sesong viser tavlen en tom startstilling, ikke eksempelpoeng.

Sommer- og vinterleiren deler sesong. **Etter vinterleiren** oppretter dere en ny sesong (alle hus starter på null), publiserer den og velger den som aktiv. Forrige sesong blir liggende som historikk i Sanity. Det er ingen automatisk sletting eller kalenderstyrt nullstilling.

Nettsiden henter publiserte poeng fra det offentlige Sanity-datasettet hvert 15. sekund mens tavlen er nær skjermen og nettleserfanen er aktiv. Poengendringer krever ikke ny bygging av nettsiden. Ingen skrivetoken sendes til nettleseren. Ved nettverksfeil vises siste hentede stilling med beskjed og automatisk nytt forsøk. Tillat nettstedets faktiske URL under Sanity API → CORS origins dersom nettleseren blokkerer forespørslene; denne lesingen bruker ikke credentials.

Kjør `node scripts/check-house-cup.mjs` med lokal nettside på port 4321 for å kontrollere oppdateringer, delt ledelse, nettverksfeil og bytte til ny sesong. Testdata brukes bare i nettlesertesten og publiseres aldri til Sanity. Kjør `CUP_CHECK_LIVE=1 node scripts/check-house-cup.mjs` for også å kontrollere faktisk Sanity-tilgang fra nettleseren.
