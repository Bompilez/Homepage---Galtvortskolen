import { createClient } from '@sanity/client';
import fallback from './content.json';
import teamFallback from './team.json';

export type TeamMember = {
  _key: string;
  name: string;
  responsibility?: string;
  character: string;
  subject?: string;
  bio: string[];
  photos: (SiteImage & { _key: string })[];
};
export type TeamContent = { title: string; intro: string; members: TeamMember[] };

type PageSection = {
  _key: string;
  title: string;
  paragraphs: string[];
  anchor?: string;
  linkLabel?: string;
  linkUrl?: string;
};
type ContentPage = Omit<(typeof fallback.pages)[number], 'sections'> & { sections: PageSection[] };
export type SiteContent = Omit<typeof fallback, 'pages' | 'home'> & {
  home: typeof fallback.home;
  pages: ContentPage[];
  team: TeamContent;
};
export type SiteImage = { url: string; alt: string };
const imageProjection = '{"url": asset->url, alt}';

export async function getContent(): Promise<SiteContent> {
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  if (import.meta.env.DEV && import.meta.env.SANITY_LOCAL_PREVIEW === 'true')
    return { ...fallback, team: teamFallback };
  if (!projectId) return { ...fallback, team: teamFallback };
  const client = createClient({
    projectId,
    dataset: import.meta.env.SANITY_DATASET || 'production',
    apiVersion: '2026-01-01',
    useCdn: false,
    perspective: 'published',
  });
  const content = await client.fetch<SiteContent>(`{
    "settings": *[_id == "siteSettings"][0],
    "home": *[_id == "homePage"][0]{..., heroImage${imageProjection}, parentsImage${imageProjection}, experiences[]{..., image${imageProjection}}},
    "events": *[_type == "event"] | order(startDate asc){..., "slug": slug.current, image${imageProjection}},
    "pages": *[_type == "page"]{..., "slug": slug.current, image${imageProjection}},
    "team": *[_id == "teamPage"][0]{title, intro, members[]{..., photos[]{_key, "url": asset->url, alt}}}
  }`);
  if (!content.settings || !content.home || !content.pages?.length) {
    throw new Error('Sanity mangler startinnhold. Kjør npm run cms:seed før nettsiden bygges.');
  }
  // Existing projects can preview the team while the new singleton is being imported.
  return { ...content, team: content.team ?? teamFallback };
}

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date + 'T12:00:00Z'));
}
export function money(amount: number) {
  return new Intl.NumberFormat('nb-NO').format(amount) + ' kr';
}
export function registrationIsOpen(event: SiteContent['events'][number]) {
  return event.registrationOpen && event.deadline >= new Date().toISOString().slice(0, 10);
}
export function safeLink(value: string | undefined) {
  if (!value) return '#';
  if (/^\/(?!\/)/.test(value) || /^#[\w-]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (['https:', 'http:', 'mailto:'].includes(url.protocol)) return value;
  } catch {
    /* invalid URL */
  }
  return '#';
}
