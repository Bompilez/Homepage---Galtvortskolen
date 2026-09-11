import { defineField, defineType } from 'sanity';

export const houseCup = defineType({
  name: 'houseCup',
  title: 'Huscup · aktiv sesong',
  type: 'document',
  fields: [
    defineField({
      name: 'season',
      title: 'Sesongen som vises på forsiden',
      type: 'reference',
      to: [{ type: 'cupSeason' }],
      description:
        'Sesongen går fra sommerleiren til vinterleiren. Etter vinterleiren oppretter du en ny sesong med null poeng og velger den her. Den gamle sesongen beholdes. Publiser den nye sesongen først, og publiser deretter dette valget.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Huscup · aktiv sesong' }) },
});
export const cupSeason = defineType({
  name: 'cupSeason',
  title: 'Huscup-sesong',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Sesong',
      type: 'string',
      description: 'For eksempel Sommer 2027 – vinter 2028.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'scores',
      title: 'Startpoeng',
      type: 'object',
      description:
        'La stå på 0 for en ny sesong. Brukes bare hvis dere flytter inn en eksisterende poengstilling. Nye pluss- og minuspoeng registreres i poengloggen under, og legges automatisk til startpoengene.',
      validation: (R) => R.required(),
      fields: [
        ['griffing', 'Griffing'],
        ['smygard', 'Smygard'],
        ['ravnklo', 'Ravnklo'],
        ['hasblas', 'Håsblås'],
      ].map(([name, title]) =>
        defineField({
          name,
          title,
          type: 'number',
          initialValue: 0,
          validation: (R) => R.required().integer().min(0),
        }),
      ),
    }),
    defineField({
      name: 'entries',
      title: 'Poenglogg',
      type: 'array',
      description:
        'Legg til én hendelse per tildeling eller trekk, og trykk Publiser. Navn og begrunnelse vises på forsiden. Bruk deltakernes visningsnavn eller navnet på laget. Totalene regnes ut automatisk.',
      of: [
        {
          type: 'object',
          name: 'pointEntry',
          title: 'Poenghendelse',
          fields: [
            defineField({
              name: 'recipient',
              title: 'Hvem fikk poengene?',
              type: 'string',
              description: 'Visningsnavn, karakter eller lag.',
              validation: (R) => R.required().max(100),
            }),
            defineField({
              name: 'house',
              title: 'Hus',
              type: 'string',
              options: {
                list: [
                  { title: 'Griffing', value: 'griffing' },
                  { title: 'Smygard', value: 'smygard' },
                  { title: 'Ravnklo', value: 'ravnklo' },
                  { title: 'Håsblås', value: 'hasblas' },
                ],
                layout: 'radio',
              },
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'points',
              title: 'Poeng (+ eller −)',
              type: 'number',
              description: 'For eksempel 10 for tildeling eller -5 for trekk.',
              validation: (R) =>
                R.required()
                  .integer()
                  .custom((value) => (value === 0 ? 'Skriv et pluss- eller minusbeløp.' : true)),
            }),
            defineField({
              name: 'reason',
              title: 'Hvorfor?',
              type: 'text',
              rows: 3,
              validation: (R) => R.required().max(500),
            }),
            defineField({
              name: 'awardedBy',
              title: 'Gitt av (lærer)',
              type: 'string',
              description:
                'Lærerens navn eller professornavn. Vises sammen med tildelingen eller poengtrekket.',
              validation: (R) => R.required().max(100),
            }),
            defineField({
              name: 'occurredAt',
              title: 'Tidspunkt',
              type: 'datetime',
              initialValue: () => new Date().toISOString(),
              validation: (R) => R.required(),
            }),
          ],
          preview: {
            select: { recipient: 'recipient', points: 'points', subtitle: 'reason' },
            prepare: ({ recipient, points, subtitle }) => ({
              title: `${points > 0 ? '+' : ''}${points ?? '?'} · ${recipient || 'Ny poenghendelse'}`,
              subtitle,
            }),
          },
        },
      ],
    }),
  ],
  initialValue: { entries: [], scores: { griffing: 0, smygard: 0, ravnklo: 0, hasblas: 0 } },
  preview: { select: { title: 'title' } },
});
