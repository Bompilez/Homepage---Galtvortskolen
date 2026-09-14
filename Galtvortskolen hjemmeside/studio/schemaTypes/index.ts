import { houseCup, cupSeason } from './houseCup';
import { defineField, defineType } from 'sanity';

const text = (name: string, title: string, multiline = false) =>
  defineField({
    name,
    title,
    type: multiline ? 'text' : 'string',
    validation: (Rule) => Rule.required(),
  });
const image = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'image',
    options: { hotspot: true },
    validation: (Rule) => Rule.required().assetRequired(),
    fields: [
      defineField({
        name: 'alt',
        title: 'Beskriv bildet',
        description: 'Leses opp for besøkende som bruker skjermleser.',
        type: 'string',
        validation: (Rule) => Rule.required(),
      }),
    ],
  });
const link = (name: string, title: string, required = true) =>
  defineField({
    name,
    title,
    type: 'url',
    validation: (Rule) =>
      required
        ? Rule.required().uri({ allowRelative: true, scheme: ['https', 'http', 'mailto'] })
        : Rule.uri({ allowRelative: true, scheme: ['https', 'http', 'mailto'] }),
  });
const paragraphs = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [{ type: 'text', title: 'Avsnitt' }],
    validation: (Rule) => Rule.required().min(1),
  });
const slug = defineField({
  name: 'slug',
  title: 'Nettadresse',
  type: 'slug',
  description: 'Unngå å endre adressen etter publisering. Da kan gamle lenker slutte å virke.',
  options: { source: 'title', maxLength: 80 },
  validation: (Rule) =>
    Rule.required().custom((value) =>
      !value?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)
        ? true
        : 'Bruk små bokstaver a–z, tall og bindestrek.',
    ),
});

const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Innstillinger',
  type: 'document',
  fields: [
    text('siteName', 'Navn på nettsiden'),
    text('description', 'Beskrivelse for søkemotorer', true),
    link('bookingUrl', 'Lenke til påmeldingsskjema'),
    link('facebookUrl', 'Facebook'),
    link('instagramUrl', 'Instagram'),
    link('discordUrl', 'Invitasjonslenke til Discord', false),
    defineField({
      name: 'announcement',
      title: 'Melding øverst på nettsiden',
      type: 'string',
      description: 'Tøm feltet for å skjule meldingen.',
    }),
    link('announcementUrl', 'Hvor skal toppmeldingen lenke?'),
  ],
  preview: { prepare: () => ({ title: 'Nettsidens innstillinger' }) },
});

const homePage = defineType({
  name: 'homePage',
  title: 'Forside',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hovedbilde og velkomst', default: true },
    { name: 'intro', title: 'Introduksjon' },
    { name: 'experiences', title: 'Opplevelser' },
    { name: 'parents', title: 'For foresatte' },
    { name: 'closing', title: 'Avslutning' },
  ],
  fields: [
    ...[
      text('title', 'Hovedoverskrift', true),
      text('intro', 'Innledning', true),
      image('heroImage', 'Hovedbilde'),
    ].map((field) => ({ ...field, group: 'hero' })),
    ...[text('introTitle', 'Overskrift', true), text('introText', 'Introduksjonstekst', true)].map(
      (field) => ({ ...field, group: 'intro' }),
    ),
    { ...text('experienceTitle', 'Overskrift over opplevelser'), group: 'experiences' },
    defineField({
      name: 'experiences',
      title: 'Opplevelseskort',
      description: 'Dra kortene for å endre rekkefølgen.',
      type: 'array',
      group: 'experiences',
      validation: (Rule) => Rule.required().min(1).max(6),
      of: [
        {
          type: 'object',
          name: 'experience',
          title: 'Opplevelse',
          fields: [
            text('title', 'Overskrift'),
            text('text', 'Beskrivelse', true),
            image('image', 'Bilde'),
            link('href', 'Lenke'),
          ],
          preview: { select: { title: 'title', media: 'image' } },
        },
      ],
    }),
    ...[
      text('parentsTitle', 'Overskrift', true),
      text('parentsText', 'Tekst', true),
      image('parentsImage', 'Bilde'),
    ].map((field) => ({ ...field, group: 'parents' })),
    ...[text('ctaTitle', 'Overskrift'), text('ctaText', 'Tekst', true)].map((field) => ({
      ...field,
      group: 'closing',
    })),
  ],
  preview: { prepare: () => ({ title: 'Forsiden' }) },
});

const event = defineType({
  name: 'event',
  title: 'Arrangement',
  type: 'document',
  fields: [
    text('title', 'Navn på arrangementet'),
    slug,
    text('category', 'Type arrangement'),
    defineField({
      name: 'startDate',
      title: 'Startdato',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Sluttdato',
      type: 'date',
      validation: (Rule) => Rule.required().min(Rule.valueOfField('startDate')),
    }),
    defineField({
      name: 'deadline',
      title: 'Påmeldingsfrist',
      type: 'date',
      validation: (Rule) => Rule.required().max(Rule.valueOfField('startDate')),
    }),
    text('location', 'Sted'),
    defineField({
      name: 'price',
      title: 'Pris per deltaker i kroner',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    text('age', 'Aldersgruppe'),
    defineField({
      name: 'registrationOpen',
      title: 'Påmeldingen er åpen',
      type: 'boolean',
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    text('summary', 'Kort beskrivelse', true),
    image('image', 'Arrangementsbilde'),
    paragraphs('body', 'Om arrangementet'),
    defineField({
      name: 'included',
      title: 'Inkludert i prisen',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'startDate', media: 'image' } },
});

const page = defineType({
  name: 'page',
  title: 'Informasjonsside',
  type: 'document',
  fields: [
    text('eyebrow', 'Kort sidenavn'),
    text('title', 'Hovedoverskrift', true),
    slug,
    text('intro', 'Innledning', true),
    image('image', 'Hovedbilde'),
    defineField({
      name: 'sections',
      title: 'Innhold på siden',
      description: 'Legg til seksjoner og dra dem i ønsket rekkefølge.',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          name: 'section',
          title: 'Tekstseksjon',
          fields: [
            text('title', 'Overskrift'),
            defineField({
              name: 'anchor',
              title: 'Ankerlenke (valgfritt)',
              type: 'string',
              description: 'For eksempel kontakt. Bruk små bokstaver uten mellomrom.',
              validation: (Rule) => Rule.regex(/^[a-z0-9-]+$/),
            }),
            paragraphs('paragraphs', 'Avsnitt'),
            defineField({ name: 'linkLabel', title: 'Lenketekst (valgfritt)', type: 'string' }),
            link('linkUrl', 'Lenke (valgfritt)', false),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
    }),
  ],
  preview: { select: { title: 'eyebrow', media: 'image' } },
});
const teamPage = defineType({
  name: 'teamPage',
  title: 'Professorer og team',
  type: 'document',
  fields: [
    text('title', 'Overskrift'),
    text('intro', 'Introduksjon', true),
    defineField({
      name: 'members',
      title: 'Teammedlemmer',
      type: 'array',
      description: 'Dra kortene for å endre rekkefølgen. Det første bildet brukes på kortet.',
      of: [
        {
          type: 'object',
          name: 'teamMember',
          title: 'Teammedlem',
          fields: [
            text('name', 'Navn'),
            defineField({ name: 'responsibility', title: 'Ansvarsområde', type: 'string' }),
            text('character', 'Rolle / karakter'),
            defineField({ name: 'subject', title: 'Fag', type: 'string' }),
            paragraphs('bio', 'Biografi i Les mer-vinduet'),
            defineField({
              name: 'photos',
              title: 'Bilder',
              type: 'array',
              validation: (Rule) => Rule.required().min(1),
              of: [image('portrait', 'Portrett')],
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'character', media: 'photos.0' } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Professorer og team' }) },
});
export const schemaTypes = [siteSettings, homePage, event, page, teamPage, houseCup, cupSeason];
