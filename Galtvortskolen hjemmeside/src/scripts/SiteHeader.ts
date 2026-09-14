const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.querySelector<HTMLElement>('#site-menu');
function closeMenu() {
  if (toggle && menu) {
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  }
}
toggle?.addEventListener('click', () => {
  if (menu) {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (toggle?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener('pointerdown', (event) => {
  if (
    toggle?.getAttribute('aria-expanded') === 'true' &&
    !menu?.contains(event.target as Node) &&
    !toggle.contains(event.target as Node)
  )
    closeMenu();
});
