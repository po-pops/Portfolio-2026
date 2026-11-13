/* ==========================================================================
   Contenu modifiable dans Sanity (Studio : https://pauline-yvelin.sanity.studio)
   Le HTML garde le contenu de secours ; dès que Sanity répond, les textes,
   liens et images publiés dans le Studio le remplacent. La dernière version
   reçue est gardée dans le navigateur pour s'afficher tout de suite la fois suivante.
   ========================================================================== */
(() => {
  const PROJECT = 'h1m9xg4z';
  const DATASET = 'production';
  const STORE = `cms-${PROJECT}`;
  const img = '{alt, "url": asset->url}';
  const QUERY = `{
    "accueil": *[_id == "accueil"][0]{texteRond, boutonCafe},
    "projets": *[_type == "projet"] | order(page asc){page, nom, nomCourt, etiquettes, lien, introduction,
      etapes[]{titre, texte}, "grande": grandeImage${img}, "petites": petitesImages[]${img}, "vignette": vignette${img}},
    "aPropos": *[_id == "aPropos"][0]{titre, sousTitre, paragraphes, boutonCv, "photo": photo${img}, "cv": cv.asset->url,
      "musique": musique{texte, url, "image1": image1${img}, "image2": image2${img}}},
    "contact": *[_id == "contact"][0]{email, nom, metier, exemple, "timbre": timbre${img}}
  }`;
  const URL_API = `https://${PROJECT}.apicdn.sanity.io/v2024-01-01/data/query/${DATASET}?perspective=published&query=${encodeURIComponent(QUERY)}`;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sized = (url, w) => (url ? `${url}?w=${w}&auto=format&q=82` : '');
  const setImg = (el, im, w) => {
    if (!el || !im || !im.url) return;
    const src = sized(im.url, w);
    if (el.getAttribute('src') !== src) el.setAttribute('src', src);
    if (im.alt != null) el.setAttribute('alt', im.alt);
  };
  const setText = (el, s) => { if (el && s && el.textContent !== s) el.textContent = s; };

  // La police des titres (démo) n'a pas les lettres accentuées : on pose l'accent en CSS.
  function accents(text) {
    return String(text).split(/(\s+)/).map((word) => {
      if (/^\s+$/.test(word)) return word;
      let accented = false;
      const out = [...word].map((ch) => {
        if (/[éÉ]/.test(ch)) { accented = true; return `<span class="acc">${ch === 'É' ? 'E' : 'e'}</span>`; }
        if (/[èÈàÀùÙ]/.test(ch)) { accented = true; const base = ch.normalize('NFD')[0]; return `<span class="acc acc-grave">${base}</span>`; }
        const plain = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
        return esc(plain);
      }).join('');
      return accented ? `<span class="nw">${out}</span>` : out;
    }).join('');
  }

  const projectNumber = () => Number((location.pathname.match(/project-(\d+)/) || [])[1]);

  const APPLY = {
    home(page, extra, d) {
      const a = d.accueil || {};
      if (a.texteRond) {
        const tp = page.querySelector('.about-cta textPath');
        const t = `${a.texteRond}  *  `;
        setText(tp, t + t);
      }
      setText(extra && extra.querySelector('.cafe-cta > span'), a.boutonCafe);
      (d.projets || []).forEach((p) => {
        const card = page.querySelector(`a.float-card[href="project-${p.page}.html"]`);
        if (!card) return;
        setImg(card.querySelector('.inner > img'), p.vignette, 900);
        if (p.nomCourt) {
          card.dataset.name = p.nomCourt;
          setText(card.querySelector('.card-name > span'), p.nomCourt);
        }
      });
    },

    project(page, extra, d) {
      const p = (d.projets || []).find((x) => x.page === projectNumber());
      if (!p) return;
      const h1 = page.querySelector('h1.card-title');
      if (h1 && p.nom && h1.getAttribute('aria-label') !== p.nom) {
        h1.setAttribute('aria-label', p.nom);
        h1.innerHTML = `<span aria-hidden="true">${accents(p.nom)}</span>`;
      }
      const tags = page.querySelector('.tags');
      if (tags && p.etiquettes) tags.innerHTML = p.etiquettes.map((t) => `<span class="tag">${esc(t)}</span>`).join('');

      const link = page.querySelector('a.site-link');
      if (link && p.lien) {
        link.style.display = p.lien.url ? '' : 'none';
        if (p.lien.url) link.href = p.lien.url;
        setText(link.querySelector('.site-label'), p.lien.texte);
      }

      const heading = page.querySelector('.project-title');
      if (heading && p.introduction) {
        page.querySelectorAll('p.card-copy').forEach((el) => el.remove());
        heading.insertAdjacentHTML('afterend', p.introduction.filter(Boolean).map((t) => `<p class="card-copy">${esc(t)}</p>`).join(''));
      }

      const steps = page.querySelector('.steps');
      if (steps && p.etapes) {
        steps.innerHTML = p.etapes.slice(0, 4).map((s, i) => `<article class="step"><img class="step-number" src="src/project-step-${i + 1}.svg" alt="${i + 1}" /><div class="step-copy"><h3>${esc(s.titre)}</h3><p>${esc(s.texte)}</p></div></article>`).join('');
      }

      const imgs = page.querySelectorAll('.bento img');
      setImg(imgs[0], p.grande, 1800);
      (p.petites || []).forEach((im, i) => setImg(imgs[i + 1], im, 1000));
    },

    about(page, extra, d) {
      const a = d.aPropos;
      if (!a) return;
      setText(page.querySelector('#about-title'), a.titre);
      setText(page.querySelector('.copy h2'), a.sousTitre);
      const copy = page.querySelector('.copy');
      if (copy && a.paragraphes) {
        copy.querySelectorAll('p').forEach((el) => el.remove());
        copy.insertAdjacentHTML('beforeend', a.paragraphes.filter(Boolean).map((t, i) => `<p${i ? ' class="body"' : ''}>${esc(t)}</p>`).join(''));
      }
      setImg(page.querySelector('img.photo'), a.photo, 1000);
      const cv = page.querySelector('a.cv');
      if (cv && a.cv) cv.href = a.cv;
      setText(cv && cv.querySelector('.cv-label'), a.boutonCv);
      const m = a.musique || {};
      if (m.url) [page, extra].forEach((root) => root && root.querySelectorAll('a.music-card, a.music-link').forEach((el) => { el.href = m.url; }));
      setText(extra && extra.querySelector('.music-label'), m.texte);
      setImg(page.querySelector('.music-card.one img'), m.image1, 800);
      setImg(page.querySelector('.music-card.two img'), m.image2, 800);
    },

    contact(page, extra, d) {
      const c = d.contact;
      if (!c) return;
      const to = page.querySelector('.pc-to');
      if (to && c.nom) to.innerHTML = `À&nbsp;: <strong>${esc(c.nom)}</strong>${c.metier ? `, ${esc(c.metier)}` : ''}`;
      const msg = page.querySelector('#message');
      if (msg && c.exemple) msg.placeholder = c.exemple;
      setImg(page.querySelector('.stamp img'), c.timbre, 500);
    },
  };

  let data = null;
  try { data = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { data = null; }

  function apply(page = document.getElementById('page'), extra = document.getElementById('page-extra')) {
    if (!data || !page) return;
    const fn = APPLY[page.dataset.page];
    try { if (fn) fn(page, extra, data); } catch (e) { console.warn('Contenu Sanity non appliqué', e); }
  }

  const ready = fetch(URL_API)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(({ result }) => {
      if (!result) return;
      const fresh = JSON.stringify(result);
      if (fresh === JSON.stringify(data)) return;
      data = result;
      try { localStorage.setItem(STORE, fresh); } catch (e) { /* navigation privée */ }
      apply();
      window.dispatchEvent(new Event('stage:fit'));
    })
    .catch(() => { /* hors ligne : le contenu du HTML reste */ });

  window.CMS = {
    apply,
    ready,
    get data() { return data; },
  };
})();
