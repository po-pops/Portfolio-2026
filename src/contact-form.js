/* Envoi du formulaire de contact (commun aux 3 propositions).
   Le site est statique : le message part par le logiciel de mail du visiteur. */
(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const TO = 'pauline.yvelin@mmibordeaux.com';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const firstName = (data.get('firstName') || '').toString().trim();
    const lastName = (data.get('lastName') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();
    const order = (data.get('order') || '').toString().trim();

    const subject = order
      ? `${order} – ${firstName} ${lastName}`.trim()
      : `Message de ${firstName} ${lastName}`.trim();
    const body = [
      `Prénom : ${firstName}`,
      `Nom : ${lastName}`,
      `Email : ${email}`,
      order ? `Sujet : ${order}` : null,
      '',
      'Message :',
      message
    ].filter((l) => l !== null).join('\n');

    const href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const delay = Number(form.dataset.sendDelay || 900);
    document.body.classList.add('is-sent');
    form.dispatchEvent(new CustomEvent('contact:sent', { detail: { firstName } }));
    setTimeout(() => { window.location.href = href; }, delay);
  });

  // « Écrire un autre message »
  document.querySelectorAll('[data-reset]').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.body.classList.remove('is-sent');
      form.reset();
      form.dispatchEvent(new Event('input'));
    })
  );

  // Les noms qui apparaissent ailleurs (ticket, carte…) suivent la saisie
  const sync = () => {
    const data = new FormData(form);
    document.querySelectorAll('[data-bind]').forEach((el) => {
      const key = el.dataset.bind;
      const v = (data.get(key) || '').toString().trim();
      el.textContent = v || el.dataset.empty || '';
      el.classList.toggle('is-empty', !v);
    });
  };
  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  sync();
})();
