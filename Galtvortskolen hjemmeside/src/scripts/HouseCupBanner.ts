import { standings, leaderLabel, type Cup } from '../lib/house-cup';

document.querySelectorAll<HTMLElement>('[data-cup-banner]').forEach((banner) => {
  const endpoint = banner.dataset.cupEndpoint;
  const leader = banner.querySelector<HTMLElement>('[data-banner-leader]')!;
  const points = banner.querySelector<HTMLElement>('[data-banner-points]')!;
  let pending = false;

  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch(endpoint!, {
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('Could not fetch cup');
      const payload = await response.json();
      const cup: Cup | null = payload.result ?? null;
      if (!cup) {
        banner.classList.remove('is-visible');
        document.documentElement.classList.remove('has-cup-banner');
        return;
      }
      const rows = standings(cup);
      const hasPoints = rows.some((row) => row.points !== 0);
      const top = rows[0];
      banner.style.setProperty('--leader-color', top.color);
      leader.textContent = leaderLabel(cup);
      points.textContent = hasPoints ? top.points.toLocaleString('nb-NO') : '0';
      banner.classList.add('is-visible');
      document.documentElement.classList.add('has-cup-banner');
    } catch {
      banner.classList.remove('is-visible');
      document.documentElement.classList.remove('has-cup-banner');
    } finally {
      pending = false;
    }
  }

  if (banner.classList.contains('is-visible')) {
    document.documentElement.classList.add('has-cup-banner');
  }
  if (!endpoint) return;
  void refresh();
  window.setInterval(() => void refresh(), 15000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void refresh();
  });
});
