import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId)
  throw new Error(
    'Sanity er ikke koblet til ennå. Kopier studio/.env.example til studio/.env og legg inn SANITY_STUDIO_PROJECT_ID.',
  );
const singletons = new Set(['homePage', 'siteSettings', 'teamPage', 'houseCup']);

export default defineConfig({
  name: 'galtvortskolen',
  title: 'Galtvortskolen · Redaktør',
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Nettsiden')
          .items([
            S.listItem()
              .title('Forside')
              .child(S.document().schemaType('homePage').documentId('homePage')),
            S.listItem()
              .title('Arrangementer')
              .child(S.documentTypeList('event').title('Arrangementer')),
            S.listItem()
              .title('Informasjonssider')
              .child(S.documentTypeList('page').title('Informasjonssider')),
            S.listItem()
              .title('Professorer og team')
              .child(S.document().schemaType('teamPage').documentId('teamPage')),
            S.listItem()
              .title('Huscup · aktiv sesong')
              .child(S.document().schemaType('houseCup').documentId('houseCup')),
            S.listItem()
              .title('Huscup · sesonger og poeng')
              .child(S.documentTypeList('cupSeason').title('Sesonger og poeng')),
            S.divider(),
            S.listItem()
              .title('Innstillinger og påmelding')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((t) => !singletons.has(t.schemaType)),
  },
  document: {
    actions: (actions, context) =>
      singletons.has(context.schemaType)
        ? actions.filter((a) => !['delete', 'duplicate', 'unpublish'].includes(a.action || ''))
        : actions,
  },
});
