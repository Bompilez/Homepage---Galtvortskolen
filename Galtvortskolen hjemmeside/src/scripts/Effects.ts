const targets = document.querySelectorAll<HTMLElement>('[data-cup-glint]');

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-enchanted');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );
    targets.forEach((target) => observer.observe(target));
  } else {
    targets.forEach((target) => target.classList.add('is-enchanted'));
  }
}
