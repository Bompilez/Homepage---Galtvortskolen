document.querySelectorAll<HTMLElement>('.floating-stars span').forEach((star) => {
  const direction = () => (Math.random() < 0.5 ? -1 : 1);
  star.style.setProperty('--drift-x', `${Math.round((12 + Math.random() * 18) * direction())}px`);
  star.style.setProperty('--drift-y', `${Math.round((11 + Math.random() * 17) * direction())}px`);
  star.style.setProperty('--wander-duration', `${(26 + Math.random() * 10).toFixed(1)}s`);
  star.style.setProperty('--wander-delay', `${(-Math.random() * 30).toFixed(1)}s`);
  star.style.setProperty('--shape-duration', `${(4 + Math.random() * 4).toFixed(1)}s`);
  star.style.setProperty('--shape-delay', `${(-Math.random() * 8).toFixed(1)}s`);
});
