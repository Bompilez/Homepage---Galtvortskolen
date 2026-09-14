export {};

const dialog = document.querySelector<HTMLDialogElement>('#team-dialog');
const content = dialog?.querySelector<HTMLElement>('.team-dialog-content');
let opener: HTMLButtonElement | null = null;

document.querySelectorAll<HTMLButtonElement>('[data-team-template]').forEach((button) => {
  button.addEventListener('click', () => {
    const template = document.getElementById(button.dataset.teamTemplate || '');
    if (!(template instanceof HTMLTemplateElement) || !dialog || !content) return;
    opener = button;
    content.replaceChildren(template.content.cloneNode(true));
    dialog.showModal();
    dialog.scrollTop = 0;
    document.documentElement.classList.add('team-dialog-open');
  });
});

function restorePage() {
  document.documentElement.classList.remove('team-dialog-open');
  content?.replaceChildren();
  opener?.focus({ preventScroll: true });
}
function closeDialog() {
  dialog?.close();
  restorePage();
}
dialog?.querySelector('.team-close')?.addEventListener('click', closeDialog);
dialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeDialog();
});
dialog?.addEventListener('close', () => {
  if (!dialog.open) restorePage();
});

function outside(event: MouseEvent) {
  if (!dialog || event.target !== dialog) return false;
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}
let startedOutside = false;
dialog?.addEventListener('pointerdown', (event) => {
  startedOutside = outside(event);
});
dialog?.addEventListener('click', (event) => {
  if (startedOutside && outside(event)) closeDialog();
  startedOutside = false;
  const target =
    event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('[data-photo-src]')
      : null;
  const portrait = content?.querySelector<HTMLImageElement>('.team-dialog-portrait');
  if (!target?.dataset.photoSrc || !portrait) return;
  portrait.src = target.dataset.photoSrc;
  portrait.alt = target.dataset.photoAlt || '';
  content
    ?.querySelectorAll('[data-photo-src]')
    .forEach((button) => button.setAttribute('aria-pressed', String(button === target)));
});
