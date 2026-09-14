import {
  standings,
  leaderLabel,
  recentEntries,
  signedPoints,
  entryDate,
  houses,
  type Cup,
} from '../lib/house-cup';

document.querySelectorAll<HTMLElement>('[data-cup-endpoint]').forEach((board) => {
  const endpoint = board.dataset.cupEndpoint;
  if (!endpoint) return;
  const status = board.querySelector<HTMLElement>('[data-cup-status]')!;
  const list = board.querySelector<HTMLOListElement>('.cup-rows')!;
  const eventList = board.querySelector<HTMLOListElement>('[data-cup-events]');
  const template = board.querySelector<HTMLTemplateElement>('[data-cup-event-template]');
  const empty = board.querySelector<HTMLElement>('[data-cup-empty]');
  const floatingCards = board.querySelector<HTMLElement>('[data-cup-floating-cards]');
  let pending = false;
  let visible = false;
  let lastResult = '';

  function updateFloatingCards(cup: Cup | null) {
    if (!floatingCards) return;
    const entries = recentEntries(cup);
    const cards =
      entries.length > 0
        ? Array.from({ length: Math.min(12, Math.max(8, entries.length)) }, (_, index) => {
            const entry = entries[index % entries.length];
            const house = houses.find((item) => item.key === entry.house) ?? houses[0];
            return {
              house: house.name,
              color: house.color,
              points: signedPoints(entry.points),
              text: entry.reason,
            };
          })
        : Array.from({ length: 12 }, (_, index) => {
            const rows = standings(cup);
            const row = rows[index % rows.length];
            return {
              house: row.name,
              color: row.color,
              points: row.points.toLocaleString('nb-NO'),
              text: row.points ? 'Huset holder stand i kampen.' : 'Klart for nye poeng.',
            };
          });

    floatingCards.replaceChildren(
      ...cards.map((card, index) => {
        const item = document.createElement('span');
        const points = document.createElement('b');
        const house = document.createElement('small');
        const text = document.createElement('em');
        item.className = 'cup-floating-card';
        item.style.setProperty('--event-house-color', card.color);
        item.style.setProperty('--float-index', String(index));
        points.textContent = card.points;
        house.textContent = card.house;
        text.textContent = card.text;
        item.append(points, house, text);
        return item;
      }),
    );
  }

  async function refresh() {
    if (pending || !visible || document.hidden) return;
    pending = true;
    try {
      const response = await fetch(endpoint!, {
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('Could not fetch standings');
      const payload = await response.json();
      if (!Object.hasOwn(payload, 'result')) throw new Error('Invalid standings response');
      const cup: Cup | null = payload.result;
      const signature = JSON.stringify(cup);
      if (signature !== lastResult) {
        const rows = standings(cup);
        board.style.setProperty('--leader-color', rows[0].color);
        const maximum = Math.max(1, ...rows.map((row) => row.points));
        board.querySelector('[data-cup-season]')!.textContent = cup?.title ?? 'Huscupen';
        board.querySelector('[data-cup-leader]')!.textContent = leaderLabel(cup);
        rows.forEach((row) => {
          const item = list.querySelector<HTMLElement>(`[data-house="${row.key}"]`)!;
          item.dataset.leading = String(
            rows.some((house) => house.points !== 0) && row.points === rows[0].points,
          );
          item.querySelector('[data-cup-points]')!.textContent =
            `${row.points.toLocaleString('nb-NO')} poeng`;
          item.querySelector<HTMLElement>('[data-cup-bar]')!.style.width =
            `${(Math.max(0, row.points) / maximum) * 100}%`;
          list.append(item);
        });
        updateFloatingCards(cup);

        if (eventList && template && empty) {
          const events = recentEntries(cup);
          const fragment = document.createDocumentFragment();
          events.forEach((entry) => {
            const item = template.content.cloneNode(true) as DocumentFragment;
            item.querySelector<HTMLElement>('li')!.dataset.kind =
              entry.points > 0 ? 'award' : 'deduction';
            item
              .querySelector<HTMLElement>('li')!
              .style.setProperty(
                '--event-house-color',
                houses.find((house) => house.key === entry.house)!.color,
              );
            item.querySelector('[data-event-points]')!.textContent = signedPoints(entry.points);
            item.querySelector('[data-event-recipient]')!.textContent = entry.recipient;
            item.querySelector('[data-event-meta]')!.textContent =
              `${houses.find((house) => house.key === entry.house)?.name} · ${entryDate(entry.occurredAt)}`;
            item.querySelector('[data-event-reason]')!.textContent = entry.reason;
            const teacher = item.querySelector<HTMLElement>('[data-event-by]')!;
            teacher.textContent = entry.awardedBy ? `Gitt av ${entry.awardedBy}` : '';
            teacher.hidden = !entry.awardedBy;
            fragment.append(item);
          });
          eventList.replaceChildren(fragment);
          empty.hidden = events.length > 0;
        }
        lastResult = signature;
      }
      const date = cup?._updatedAt ? new Date(cup._updatedAt) : null;
      status.textContent = cup
        ? date && !Number.isNaN(date.getTime())
          ? `Poeng oppdatert ${date.toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. Sjekkes hvert 15. sekund.`
          : 'Poengstillingen er oppdatert. Sjekkes hvert 15. sekund.'
        : 'Ingen poeng er publisert ennå.';
      board.dataset.connection = 'ok';
    } catch {
      status.textContent =
        'Kunne ikke hente nye poeng. Viser sist hentede stilling og prøver igjen automatisk.';
      board.dataset.connection = 'error';
    } finally {
      pending = false;
    }
  }

  new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) void refresh();
    },
    { rootMargin: '200px' },
  ).observe(board);
  window.setInterval(() => void refresh(), 15000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void refresh();
  });
  window.addEventListener('online', () => void refresh());
});
