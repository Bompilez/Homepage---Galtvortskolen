const magicRoot = document.querySelector<HTMLElement>('.site-magic');
if (magicRoot) {
  const root = magicRoot;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const context = canvas.getContext('2d');
  const button = root.querySelector<HTMLButtonElement>('button')!;
  const label = root.querySelector<HTMLElement>('[data-magic-label]')!;
  const message = root.querySelector<HTMLElement>('.magic-message')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('main h1, main h2, main h3').forEach((heading) => {
    if (heading.childElementCount || !heading.textContent?.trim()) return;
    const shine = document.createElement('span');
    shine.className = 'magic-title-shine';
    shine.setAttribute('aria-hidden', 'true');
    shine.textContent = heading.textContent;
    heading.classList.add('magic-title');
    heading.append(shine);
  });
  type Spark = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    born: number;
    life: number;
    size: number;
  };
  let sparks: Spark[] = [];
  let active = false;
  let frame = 0;
  let messageTimer: ReturnType<typeof setTimeout>;
  let lastMove = 0;
  let lastFrame = 0;
  let glow = { x: 0, y: 0, born: -10000, visible: false };

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    sparks = [];
    glow.visible = false;
    glow.born = -10000;
    context?.clearRect(0, 0, innerWidth, innerHeight);
  }

  function draw(now: number) {
    frame = 0;
    if (!context || !active || reducedMotion.matches || document.hidden) {
      clear();
      return;
    }
    const step = Math.min((now - (lastFrame || now)) / 16.67, 2);
    lastFrame = now;
    context.clearRect(0, 0, innerWidth, innerHeight);
    const light = glow.visible ? Math.max(0.42, 1 - (now - glow.born) / 1000) : 0;
    if (light > 0) {
      const gradient = context.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 140);
      gradient.addColorStop(0, `rgba(255,224,158,${light * 0.14})`);
      gradient.addColorStop(1, 'rgba(255,224,158,0)');
      context.fillStyle = gradient;
      context.fillRect(glow.x - 140, glow.y - 140, 280, 280);
    }
    sparks = sparks.filter((spark) => now - spark.born < spark.life);
    for (const spark of sparks) {
      spark.x += spark.vx * step;
      spark.y += spark.vy * step;
      spark.vy += 0.015 * step;
      const fade = 1 - (now - spark.born) / spark.life;
      const size = spark.size * fade;
      context.strokeStyle = `rgba(255,225,160,${fade * 0.85})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(spark.x - size, spark.y);
      context.lineTo(spark.x + size, spark.y);
      context.moveTo(spark.x, spark.y - size);
      context.lineTo(spark.x, spark.y + size);
      context.stroke();
    }
    if (sparks.length || glow.visible) frame = requestAnimationFrame(draw);
    else lastFrame = 0;
  }

  function cast(x: number, y: number, burst = false) {
    if (!context || !active || reducedMotion.matches || document.hidden) return;
    const now = performance.now();
    glow = { x, y, born: now, visible: true };
    for (let i = 0; i < (burst ? 22 : 2); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? 0.7 + Math.random() * 2 : 0.3;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3,
        born: now,
        life: 600 + Math.random() * 600,
        size: 1 + Math.random() * 3,
      });
    }
    sparks = sparks.slice(-70);
    if (!frame) frame = requestAnimationFrame(draw);
  }

  const storageKey = 'galtvort-lumos';
  function restore() {
    try {
      setActive(sessionStorage.getItem(storageKey) === 'on', false);
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
  }

  function setActive(value: boolean, announce = true) {
    active = value;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Nox – slukk magien' : 'Lumos – tenn magien');
    label.textContent = active ? 'Nox' : 'Litt magi?';
    root.classList.toggle('is-lit', active);
    document.body.classList.toggle('magic-enabled', active);
    clearTimeout(messageTimer);
    if (!announce) {
      root.classList.remove('show-message');
      message.textContent = '';
      if (!active) clear();
      return;
    }
    try {
      sessionStorage.setItem(storageKey, active ? 'on' : 'off');
    } catch {
      // Storage is optional; it must never prevent activation.
    }
    if (!active) {
      root.classList.remove('show-message');
      message.textContent = '';
      clear();
      return;
    }
    message.textContent = reducedMotion.matches
      ? 'Lumos! Et lite lys i mørket.'
      : 'Lumos! Beveg pekeren eller berør siden og se hva som skjer.';
    root.classList.add('show-message');
    messageTimer = setTimeout(() => root.classList.remove('show-message'), 5500);
    const rect = button.getBoundingClientRect();
    cast(rect.left + rect.width / 2, rect.top + rect.height / 2, true);
  }

  resize();
  restore();
  button.hidden = false;
  window.addEventListener('pageshow', restore);
  button.addEventListener('click', () => setActive(!active));
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || performance.now() - lastMove < 35) return;
      lastMove = performance.now();
      if (active && event.target instanceof Element) {
        const section = event.target.closest<HTMLElement>('.magic-reveal-section');
        if (section) {
          const bounds = section.getBoundingClientRect();
          section.style.setProperty('--magic-x', `${event.clientX - bounds.left}px`);
          section.style.setProperty('--magic-y', `${event.clientY - bounds.top}px`);
        }
      }
      cast(event.clientX, event.clientY);
    },
    { passive: true },
  );
  window.addEventListener('pointerleave', () => {
    glow.visible = false;
  });
  document.querySelector('main')?.addEventListener('pointerover', (event) => {
    if (!(event instanceof PointerEvent) || event.pointerType !== 'mouse' || !active || reducedMotion.matches) return;
    const heading = event.target instanceof Element ? event.target.closest('h1, h2, h3') : null;
    if (!heading || (event.relatedTarget instanceof Node && heading.contains(event.relatedTarget))) return;
    const range = document.createRange();
    range.selectNodeContents(heading);
    const textLines = Array.from(range.getClientRects()).filter((rect) => rect.width > 0);
    if (!textLines.length) return;
    const first = textLines[0];
    const last = textLines[textLines.length - 1];
    cast(first.left + first.width * 0.25, first.top + first.height / 2, true);
    cast(last.left + last.width * 0.75, last.top + last.height / 2, true);
  });
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.target instanceof Element && event.target.closest('.magic-toggle')) return;
      cast(event.clientX, event.clientY, true);
    },
    { passive: true },
  );
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
  });
  reducedMotion.addEventListener('change', clear);
  window.addEventListener('pagehide', () => {
    clear();
    clearTimeout(messageTimer);
  });
}
