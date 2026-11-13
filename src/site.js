/* ==========================================================================
   Portfolio Pauline Yvelin – script commun
   1. Mise à l'échelle du cadre (même taille sur toutes les pages)
   2. Navigation : le cadre reste, seul le contenu change (pas de rechargement)
   3. Boutons : remplissage qui part de la souris
   4. Pages : accueil (cartes à la molette), projet (défilement), contact (envoi)
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth <= 640;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ------------------------------------------------------------------
     1. Cadre : hauteur de dessin fixe (832), largeur qui suit le format
     de l'écran entre 1280 et 1520 px, pour éviter les grosses bandes vides.
     ------------------------------------------------------------------ */
  const DESIGN_H = 832;
  const MIN_W = 1280;
  const MAX_W = 1520;
  const MAX_SCALE = 1.6;

  function fitStage() {
    const stage = document.getElementById('stage');
    const outer = stage && stage.parentElement;
    const page = document.getElementById('page');
    if (!stage || !page) return;
    const vw = window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let w, h, scale;
    if (isMobile()) {
      w = 390;
      h = Number(page.dataset.mobileH || 846);
      scale = page.dataset.mobileFit === 'screen' ? Math.min(vw / w, vh / h, 1) : Math.min(vw / w, 1);
    } else {
      w = clamp(DESIGN_H * (vw / vh), MIN_W, MAX_W);
      h = DESIGN_H;
      scale = Math.min(vw / w, vh / h, MAX_SCALE);
    }
    root.style.setProperty('--stage-w', `${w}px`);
    root.style.setProperty('--stage-h', `${h}px`);
    stage.style.transform = `scale(${scale})`;
    outer.style.width = `${w * scale}px`;
    outer.style.height = `${h * scale}px`;
    window.dispatchEvent(new CustomEvent('stage:fit'));
  }
  window.addEventListener('resize', fitStage);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitStage);

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis) – une seule boucle pour toutes les instances
     ------------------------------------------------------------------ */
  const lenisSet = new Set();
  let lenisLoop = false;
  function makeLenis(options) {
    if (typeof window.Lenis !== 'function' || reduceMotion) return null;
    const lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, ...options });
    lenisSet.add(lenis);
    if (!lenisLoop) {
      lenisLoop = true;
      const raf = (t) => { lenisSet.forEach((l) => l.raf(t)); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    return lenis;
  }
  function dropLenis(lenis) {
    if (!lenis) return;
    lenis.destroy();
    lenisSet.delete(lenis);
  }

  /* ------------------------------------------------------------------
     3. Boutons : remplissage brun qui part de l'endroit où entre la souris
     et se résorbe vers l'endroit où elle sort (≈ power4.out)
     ------------------------------------------------------------------ */
  const EASE_OUT = 'cubic-bezier(.16, 1, .3, 1)';
  function currentScale(el) {
    const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const [a, b] = m[1].split(',').map(Number);
    return Math.hypot(a, b);
  }
  function setupButton(btn) {
    if (btn.dataset.fx) return;
    btn.dataset.fx = 'on';
    const circle = document.createElement('i');
    circle.className = 'fx-circle';
    circle.setAttribute('aria-hidden', 'true');
    btn.prepend(circle);
    let enter = { x: 0, y: 0 };
    const local = (e) => {
      const r = btn.getBoundingClientRect();
      const sx = r.width / btn.offsetWidth || 1;
      const sy = r.height / btn.offsetHeight || 1;
      return { x: (e.clientX - r.left) / sx, y: (e.clientY - r.top) / sy };
    };
    btn.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      const p = local(e);
      enter = p;
      const from = currentScale(circle);
      circle.getAnimations().forEach((a) => a.cancel());
      const size = Math.hypot(btn.offsetWidth, btn.offsetHeight) * 2.2;
      Object.assign(circle.style, { width: `${size}px`, height: `${size}px`, left: `${p.x}px`, top: `${p.y}px` });
      btn.classList.add('is-hovered');
      circle.animate(
        [{ transform: `translate(-50%, -50%) scale(${from})` }, { transform: 'translate(-50%, -50%) scale(1)' }],
        { duration: reduceMotion ? 1 : 900, easing: EASE_OUT, fill: 'forwards' }
      );
    });
    btn.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      const p = local(e);
      const from = currentScale(circle);
      circle.getAnimations().forEach((a) => a.cancel());
      btn.classList.remove('is-hovered');
      circle.animate(
        [
          { transform: `translate(-50%, -50%) scale(${from})` },
          { transform: `translate(calc(-50% + ${p.x - enter.x}px), calc(-50% + ${p.y - enter.y}px)) scale(0)` }
        ],
        { duration: reduceMotion ? 1 : 700, easing: EASE_OUT, fill: 'forwards' }
      );
    });
  }
  const setupButtons = (scope) => scope.querySelectorAll('.btn').forEach(setupButton);

  /* ------------------------------------------------------------------
     4a. Accueil : les cartes projet montent au fil de la molette
     ------------------------------------------------------------------ */
  function mountHome(page) {
    const cards = [...page.querySelectorAll('.float-card')];
    const fill = page.querySelector('.progress-bar-fill');
    const badge = document.getElementById('cursorBadge');
    const badgePath = document.getElementById('cursorBadgeTextPath');
    const ac = new AbortController();
    const on = (t, type, fn, opts = {}) => t.addEventListener(type, fn, { ...opts, signal: ac.signal });

    // Trajets d'origine, cartes en quinconce (gauche / droite), décalées de 0,15.
    // Un tour dure 0,6 = 4 × 0,15 : entrée en bas (0,08) puis montée (0,52). Dès qu'une carte
    // sort en haut, elle revient en bas : l'écart reste de 0,15 entre toutes les cartes.
    const OFFSET = 0.15;
    const PERIOD = 0.6;
    const ENTER = 0.08;
    const RISE = 0.52;
    const defs = [
      { y0: 68, y1: -900, r0: -9.93, r1: -18 },
      { y0: 78, y1: -1050, r0: 4.57, r1: 12 },
      { y0: 125, y1: -850, r0: -14, r1: -18 },
      { y0: 148, y1: -950, r0: 10, r1: 18 }
    ];
    const mobileRot = [-8, 4, -6, 5];
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    let target = 0;
    let current = 0;
    const nudge = (d) => { target += d; };

    cards.forEach((card) => {
      const img = card.querySelector('img');
      const ratio = () => img.naturalWidth && card.style.setProperty('--image-ratio', `${img.naturalWidth} / ${img.naturalHeight}`);
      img.complete ? ratio() : img.addEventListener('load', ratio, { once: true });
    });

    function frame() {
      current += (target - current) * 0.075;
      if (Math.abs(target - current) < 1e-5) current = target;
      const progress = ((current % PERIOD) + PERIOD) % PERIOD;
      const mobile = isMobile();

      cards.forEach((card, i) => {
        const local = (((current + i * OFFSET) % PERIOD) + PERIOD) % PERIOD;
        let rise = 0;
        let opacity = 0;
        let drop = 1;
        if (local < ENTER) {
          // entre par le bas en glissant
          opacity = easeOut(local / ENTER);
          drop = 1 - opacity;
        } else if (local < ENTER + RISE) {
          rise = (local - ENTER) / RISE;
          opacity = mobile && rise > 0.85 ? 1 - (rise - 0.85) / 0.15 : 1;
          drop = 0;
        }
        if (mobile) {
          card.style.transform = `translate(0, ${-rise * 1100 + drop * 90}px) rotate(${mobileRot[i % 4]}deg)`;
        } else {
          const d = defs[i % defs.length];
          const y = lerp(d.y0, d.y1, rise) - rise * 40 + drop * 160;
          card.style.transform = `translate(0, ${y}px) rotate(${lerp(d.r0, d.r1, rise)}deg) scale(${lerp(0.82, 1.04, rise)})`;
        }
        card.style.opacity = opacity.toFixed(3);
        card.style.pointerEvents = opacity > 0.3 ? 'auto' : 'none';
        card.style.zIndex = String(20 - i);
      });

      if (fill) fill.style.height = `${((progress % PERIOD) / PERIOD * 100).toFixed(2)}%`;
      raf = requestAnimationFrame(frame);
    }
    let raf = requestAnimationFrame(frame);

    on(window, 'wheel', (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      nudge(clamp(dy, -140, 140) * 0.0007);
    }, { passive: false });
    let touchY = null;
    on(window, 'touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    on(window, 'touchmove', (e) => {
      if (touchY === null) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      nudge((touchY - y) * 0.0025);
      touchY = y;
    }, { passive: false });
    on(window, 'touchend', () => { touchY = null; });
    on(window, 'keydown', (e) => {
      const step = { ArrowDown: 0.05, PageDown: 0.12, ' ': 0.12, ArrowUp: -0.05, PageUp: -0.12 }[e.key];
      if (step !== undefined) { e.preventDefault(); nudge(step); }
    });

    // Badge qui suit la souris au survol d'une carte
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine && badge && badgePath) {
      let mx = 0, my = 0, bx = 0, by = 0;
      const circ = 2 * Math.PI * 37;
      const fillBadge = (label) => {
        const unit = `${label} * `;
        badgePath.textContent = unit;
        const len = badgePath.getComputedTextLength() || 1;
        const reps = Math.max(1, Math.floor(circ / len));
        badgePath.textContent = ' ';
        const space = badgePath.getComputedTextLength() || 1;
        badgePath.textContent = `${label} *`;
        const fixed = badgePath.getComputedTextLength() || 1;
        const gap = ' '.repeat(Math.max(1, Math.round(Math.max(space, (circ - reps * fixed) / reps) / space)));
        badgePath.textContent = `${label} *${gap}`.repeat(reps);
      };
      on(document, 'mousemove', (e) => { mx = e.clientX; my = e.clientY; });
      cards.forEach((card) => {
        on(card, 'mouseenter', () => { fillBadge(card.dataset.name || ''); badge.classList.add('is-active'); });
        on(card, 'mouseleave', () => badge.classList.remove('is-active'));
      });
      let braf;
      const follow = () => {
        bx = lerp(bx, mx, 0.2);
        by = lerp(by, my, 0.2);
        badge.style.left = `${bx}px`;
        badge.style.top = `${by}px`;
        braf = requestAnimationFrame(follow);
      };
      braf = requestAnimationFrame(follow);
      ac.signal.addEventListener('abort', () => cancelAnimationFrame(braf));
    }

    return () => {
      ac.abort();
      cancelAnimationFrame(raf);
      if (badge) badge.classList.remove('is-active');
    };
  }

  /* ------------------------------------------------------------------
     4b. Projet : défilement doux de la fiche + flèche de défilement
     ------------------------------------------------------------------ */
  function mountProject(page) {
    const card = page.querySelector('.info-card');
    const wrapper = page.querySelector('.card-scroll');
    if (!card || !wrapper) return () => {};
    let content = wrapper.querySelector(':scope > .card-scroll-content');
    if (!content) {
      content = document.createElement('div');
      content.className = 'card-scroll-content';
      while (wrapper.firstChild) content.appendChild(wrapper.firstChild);
      wrapper.appendChild(content);
    }
    const lenis = makeLenis({ wrapper, content, eventsTarget: wrapper });

    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'scroll-hint';
    hint.innerHTML = `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle class="scroll-hint-track" cx="24" cy="24" r="22" />
        <circle class="scroll-hint-ring" cx="24" cy="24" r="22" pathLength="100" />
        <path class="scroll-hint-arrow" d="M24 15v17m-7-7 7 7 7-7" />
      </svg>`;
    card.appendChild(hint);

    const max = () => Math.max(0, wrapper.scrollHeight - wrapper.clientHeight);
    const update = () => {
      const m = max();
      const y = wrapper.scrollTop;
      const atEnd = m < 4 || y >= m - 4;
      hint.style.setProperty('--progress', (m ? y / m : 1).toFixed(4));
      card.classList.toggle('is-scrollable', m > 4);
      card.classList.toggle('is-scrolled-a-bit', y > 6);
      card.classList.toggle('is-scrolled', y > 120);
      card.classList.toggle('is-at-end', atEnd);
      hint.classList.toggle('is-up', atEnd && m > 4);
      hint.setAttribute('aria-label', atEnd ? 'Revenir en haut' : 'Lire la suite');
    };
    wrapper.addEventListener('scroll', update, { passive: true });
    window.addEventListener('stage:fit', update);
    page.querySelectorAll('img').forEach((img) => img.addEventListener('load', update, { once: true }));
    update();

    hint.addEventListener('click', () => {
      const m = max();
      const atEnd = wrapper.scrollTop >= m - 4;
      const to = atEnd ? 0 : Math.min(m, wrapper.scrollTop + wrapper.clientHeight * 0.75);
      if (lenis) lenis.scrollTo(to, { duration: 1.1 });
      else wrapper.scrollTo({ top: to, behavior: 'smooth' });
    });

    return () => {
      window.removeEventListener('stage:fit', update);
      dropLenis(lenis);
    };
  }

  /* ------------------------------------------------------------------
     4c. Contact : le message part par la messagerie du visiteur
     ------------------------------------------------------------------ */
  function mountContact(page) {
    const form = page.querySelector('#contact-form');
    if (!form) return () => {};
    const TO = 'pauline.yvelin@mmibordeaux.com';
    let timer;
    const sync = () => {
      const data = new FormData(form);
      page.querySelectorAll('[data-bind]').forEach((el) => {
        el.textContent = (data.get(el.dataset.bind) || '').toString().trim() || el.dataset.empty || '';
      });
    };
    form.addEventListener('input', sync);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const get = (k) => (d.get(k) || '').toString().trim();
      const subject = `Message de ${get('firstName')} ${get('lastName')}`.trim();
      const body = [`Prénom : ${get('firstName')}`, `Nom : ${get('lastName')}`, `Email : ${get('email')}`, '', 'Message :', get('message')].join('\n');
      sync();
      page.classList.add('is-sent');
      timer = setTimeout(() => {
        window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }, Number(form.dataset.sendDelay || 900));
    });
    page.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', () => {
      page.classList.remove('is-sent');
      form.reset();
    }));
    return () => clearTimeout(timer);
  }

  const MOUNTS = { home: mountHome, project: mountProject, contact: mountContact };
  let unmount = () => {};
  function mount() {
    const page = document.getElementById('page');
    const extra = document.getElementById('page-extra');
    root.dataset.page = page.dataset.page;
    setupButtons(page);
    if (extra) setupButtons(extra);
    const fn = MOUNTS[page.dataset.page];
    unmount = fn ? fn(page) || (() => {}) : () => {};
  }

  /* ------------------------------------------------------------------
     2. Navigation sans rechargement : le cadre ciel reste en place
     ------------------------------------------------------------------ */
  const cache = new Map();
  const loadDoc = (url) => {
    const key = url.split('#')[0];
    if (!cache.has(key)) {
      cache.set(key, fetch(key)
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then((html) => new DOMParser().parseFromString(html, 'text/html'))
        .catch((err) => { cache.delete(key); throw err; }));
    }
    return cache.get(key);
  };
  const isInternalPage = (a) => {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    const url = new URL(a.href, location.href);
    return url.origin === location.origin && /(\.html|\/)$/.test(url.pathname) && !url.pathname.endsWith('.pdf');
  };

  let busy = false;
  async function go(href, push) {
    if (busy) return;
    const target = new URL(href, location.href);
    if (target.pathname === location.pathname && push) return;
    busy = true;
    try {
      const docPromise = loadDoc(target.href);
      const page = document.getElementById('page');
      const extra = document.getElementById('page-extra');
      page.classList.add('is-leaving');
      extra.classList.add('is-leaving');
      const [doc] = await Promise.all([docPromise, wait(reduceMotion ? 0 : 260)]);
      const nextPage = doc.getElementById('page');
      const nextExtra = doc.getElementById('page-extra');
      if (!nextPage) throw new Error('page introuvable');

      unmount();
      page.replaceWith(document.importNode(nextPage, true));
      extra.replaceWith(document.importNode(nextExtra || document.createElement('div'), true));
      document.title = doc.title;
      const desc = doc.querySelector('meta[name="description"]');
      const here = document.querySelector('meta[name="description"]');
      if (desc && here) here.setAttribute('content', desc.getAttribute('content'));
      if (push) history.pushState({}, '', target.href);
      window.scrollTo(0, 0);
      fitStage();
      mount();
    } catch (err) {
      window.location.href = target.href; // en cas de souci, on charge la page normalement
    } finally {
      busy = false;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!isInternalPage(a)) return;
    e.preventDefault();
    go(a.href, true);
  });
  // on prépare la page suivante dès le survol d'un lien
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (isInternalPage(a)) loadDoc(new URL(a.href, location.href).href).catch(() => {});
  });
  window.addEventListener('popstate', () => go(location.href, false));

  fitStage();
  mount();
})();
