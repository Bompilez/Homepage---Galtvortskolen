export const houses = [
  { key: 'griffing', name: 'Griffing', color: '#ce5263' },
  { key: 'smygard', name: 'Smygard', color: '#79b769' },
  { key: 'ravnklo', name: 'Ravnklo', color: '#7285ed' },
  { key: 'hasblas', name: 'Håsblås', color: '#e1c542' },
] as const;
export type PointEntry = {
  _key: string;
  recipient: string;
  awardedBy?: string;
  house: string;
  points: number;
  reason: string;
  occurredAt: string;
};
export type Cup = {
  title: string;
  _updatedAt: string;
  scores: Record<string, number>;
  entries?: PointEntry[];
};
export const cupQuery =
  '*[_id == "houseCup"][0].season->{title, _updatedAt, scores, entries[]{_key, recipient, awardedBy, house, points, reason, occurredAt}}';

export function pointEntries(cup: Cup | null) {
  return (cup?.entries ?? []).filter(
    (entry) =>
      houses.some((house) => house.key === entry.house) &&
      Number.isSafeInteger(entry.points) &&
      entry.points !== 0,
  );
}

export function recentEntries(cup: Cup | null) {
  return pointEntries(cup)
    .slice()
    .sort((a, b) => (Date.parse(b.occurredAt) || 0) - (Date.parse(a.occurredAt) || 0))
    .slice(0, 8);
}

export function signedPoints(points: number) {
  return `${points > 0 ? '+' : '−'}${Math.abs(points).toLocaleString('nb-NO')}`;
}

export function entryDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('nb-NO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Oslo',
      });
}

export function standings(cup: Cup | null) {
  return houses
    .map((house) => ({
      ...house,
      points:
        (Number.isSafeInteger(cup?.scores?.[house.key]) ? cup!.scores[house.key] : 0) +
        pointEntries(cup)
          .filter((entry) => entry.house === house.key)
          .reduce((sum, entry) => sum + entry.points, 0),
    }))
    .sort((a, b) => b.points - a.points);
}

export function leaderLabel(cup: Cup | null) {
  if (!cup) return 'Huscupen venter på første sesong';
  const rows = standings(cup);
  if (rows.every((row) => row.points === 0)) return 'Alle hus står på 0 poeng';
  const leaders = rows.filter((row) => row.points === rows[0].points);
  return leaders.length === 1
    ? `${leaders[0].name} leder huscupen`
    : `Delt ledelse: ${leaders.map((row) => row.name).join(', ')}`;
}
