/* ==========================================================================
   Socle commun du portfolio
   1. Mise à l'échelle unique du cadre (même taille sur toutes les pages)
   2. Boutons : remplissage qui part de la souris (comme thomas-riquier.viturna.fr)
   3. Smooth scroll (Lenis) sur les zones qui défilent
   4. Indice de défilement des fiches projet
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Cadre : largeur qui suit l'écran, hauteur fixe ----------
     Le dessin fait 832 px de haut. Sa largeur s'adapte au format de l'écran
     (entre 1280 et 1520 px de dessin) pour éviter les grosses bandes vides
     à gauche et à droite, sans déformer le contenu. */
  const DESIGN_H = 832;
  const MIN_W = 1280;
  const MAX_W = 1520;
  const MAX_SCALE = 1.6;

  function fitStage() {
    const stage = document.querySelector('.stage');
    const outer = document.querySelector('.stage-outer');
    if (!stage || !outer) return;

    const vw = window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const mobile = vw <= 640;
    stage.classList.toggle('is-mobile', mobile);

    let w, h, scale;
    if (mobile) {
      w = Number(stage.dataset.mobileW || 390);
      const cssH = parseFloat(getComputedStyle(root).getPropertyValue('--mobile-stage-height'));
      h = Number(stage.dataset.mobileH || cssH || 846);
      scale = stage.dataset.mobileFit === 'screen'
        ? Math.min(vw / w, vh / h, 1)
        : Math.min(vw / w, 1);
    } else {
      w = Math.min(MAX_W, Math.max(MIN_W, DESIGN_H * (vw / vh)));
      h = DESIGN_H;
      scale = Math.min(vw / w, vh / h, MAX_SCALE);
    }

    root.style.setProperty('--stage-w', `${w}px`);
    root.style.setProperty('--stage-h', `${h}px`);
    root.style.setProperty('--stage-scale', scale);
    stage.style.transform = `scale(${scale})`;
    outer.style.width = `${w * scale}px`;
    outer.style.height = `${h * scale}px`;
    window.dispatchEvent(new CustomEvent('stage:fit', { detail: { w, h, scale, mobile } }));
  }

  window.fitStage = fitStage;
  window.addEventListener('resize', fitStage);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitStage);
  fitStage();

  /* ---------- 2. Boutons ---------- */
  const EASE_OUT = 'cubic-bezier(.16, 1, .3, 1)'; // ≈ power4.out
  const FX_SELECTOR = '.button, .cafe-cta, .button-component, .about-modal-cv-button, .fx-btn';

  function currentScale(el) {
    const m = getComputedStyle(el).transform;
    if (!m || m === 'none') return 0;
    const v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return 0;
    const [a, b] = v[1].split(',').map(Number);
    return Math.hypot(a, b);
  }

  function setupButton(btn) {
    if (btn.dataset.fx === 'on') return;
    btn.dataset.fx = 'on';
    btn.classList.add('fx-btn');
    const circle = document.createElement('i');
    circle.className = 'fx-circle';
    circle.setAttribute('aria-hidden', 'true');
    btn.prepend(circle);

    let enter = { x: 0, y: 0 };

    const localPoint = (e) => {
      const r = btn.getBoundingClientRect();
      // le cadre est mis à l'échelle : on ramène la souris dans le repère du bouton
      const sx = r.width / btn.offsetWidth || 1;
      const sy = r.height / btn.offsetHeight || 1;
      return { x: (e.clientX - r.left) / sx, y: (e.clientY - r.top) / sy };
    };

    btn.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      const p = localPoint(e);
      enter = p;
      const size = Math.hypot(btn.offsetWidth, btn.offsetHeight) * 2.2;
      const from = currentScale(circle);
      circle.getAnimations().forEach((a) => a.cancel());
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${p.x}px`;
      circle.style.top = `${p.y}px`;
      btn.classList.add('is-hovered');
      circle.animate(
        [
          { transform: `translate(-50%, -50%) scale(${from})` },
          { transform: 'translate(-50%, -50%) scale(1)' }
        ],
        { duration: reduceMotion ? 1 : 900, easing: EASE_OUT, fill: 'forwards' }
      );
    });

    btn.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      const p = localPoint(e);
      const from = currentScale(circle);
      circle.getAnimations().forEach((a) => a.cancel());
      btn.classList.remove('is-hovered');
      // le cercle se résorbe vers l'endroit où la souris est sortie
      circle.animate(
        [
          { transform: `translate(-50%, -50%) scale(${from})` },
          { transform: `translate(calc(-50% + ${p.x - enter.x}px), calc(-50% + ${p.y - enter.y}px)) scale(0)` }
        ],
        { duration: reduceMotion ? 1 : 700, easing: EASE_OUT, fill: 'forwards' }
      );
    });
  }

  function setupButtons(scope = document) {
    scope.querySelectorAll(FX_SELECTOR).forEach(setupButton);
  }
  window.setupButtons = setupButtons;
  setupButtons();

  /* ---------- 3. Smooth scroll ---------- */
  const lenisInstances = [];

  function rafLoop(time) {
    lenisInstances.forEach((l) => l.raf(time));
    requestAnimationFrame(rafLoop);
  }

  function makeLenis(options) {
    if (typeof window.Lenis !== 'function' || reduceMotion) return null;
    const lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, ...options });
    if (!lenisInstances.length) requestAnimationFrame(rafLoop);
    lenisInstances.push(lenis);
    return lenis;
  }

  // Page entière (pages qui défilent sur téléphone / tablette)
  if (document.body.dataset.smooth === 'page') {
    window.pageLenis = makeLenis({});
  }

  /* ---------- 4. Fiches projet : on doit voir qu'on peut défiler ---------- */
  document.querySelectorAll('.card-scroll').forEach((wrapper) => {
    // Lenis a besoin d'un conteneur intérieur
    let content = wrapper.querySelector(':scope > .card-scroll-content');
    if (!content) {
      content = document.createElement('div');
      content.className = 'card-scroll-content';
      while (wrapper.firstChild) content.appendChild(wrapper.firstChild);
      wrapper.appendChild(content);
    }

    const card = wrapper.closest('.info-card');
    const lenis = makeLenis({ wrapper, content, eventsTarget: wrapper });

    // Bouton rond « défiler » avec anneau de progression (composant « Scroll down » du Figma)
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'scroll-hint';
    hint.setAttribute('aria-label', 'Lire la suite');
    hint.innerHTML = `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle class="scroll-hint-track" cx="24" cy="24" r="22" />
        <circle class="scroll-hint-ring" cx="24" cy="24" r="22" pathLength="100" />
        <path class="scroll-hint-arrow" d="M24 15v17m-7-7 7 7 7-7" />
      </svg>
      <span class="scroll-hint-label">Défiler</span>`;
    (card || wrapper.parentElement).appendChild(hint);

    const max = () => Math.max(0, wrapper.scrollHeight - wrapper.clientHeight);

    function update() {
      const m = max();
      const y = wrapper.scrollTop;
      const p = m ? y / m : 1;
      hint.style.setProperty('--progress', p.toFixed(4));
      const atEnd = m < 4 || y >= m - 4;
      card && card.classList.toggle('is-scrolled', y > 120);
      card && card.classList.toggle('is-at-end', atEnd);
      card && card.classList.toggle('is-scrollable', m > 4);
      hint.classList.toggle('is-up', atEnd && m > 4);
      hint.setAttribute('aria-label', atEnd ? 'Revenir en haut' : 'Lire la suite');
    }

    wrapper.addEventListener('scroll', update, { passive: true });
    window.addEventListener('stage:fit', update);
    window.addEventListener('load', update);
    update();

    hint.addEventListener('click', () => {
      const m = max();
      const atEnd = wrapper.scrollTop >= m - 4;
      const target = atEnd ? 0 : Math.min(m, wrapper.scrollTop + wrapper.clientHeight * 0.75);
      if (lenis) lenis.scrollTo(target, { duration: 1.1 });
      else wrapper.scrollTo({ top: target, behavior: 'smooth' });
    });

    // Petit « coucou » à l'arrivée : le texte monte un peu puis redescend
    if (!reduceMotion && !window.matchMedia('(max-width: 640px)').matches) {
      let touched = false;
      wrapper.addEventListener('wheel', () => { touched = true; }, { once: true, passive: true });
      setTimeout(() => {
        if (touched || wrapper.scrollTop > 0 || max() < 40) return;
        if (lenis) {
          lenis.scrollTo(70, {
            duration: 0.9,
            onComplete: () => setTimeout(() => !touched && lenis.scrollTo(0, { duration: 0.9 }), 250)
          });
        }
      }, 1400);
    }
  });
})();
