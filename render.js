// Shared HTML builders. Used by the live site (main.js) AND the admin previews (admin/preview.js),
// so what owners see while editing is exactly what visitors get.
window.BM = (function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // CMS stores root-relative paths ("/assets/..."); the site makes them relative so it also works from a subfolder.
  const siteImg = (src) => String(src || '').replace(/^\//, '');

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pad = (n) => String(n).padStart(2, '0');
  const todayKey = () => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`; };

  // Adds display dates and upcoming/past status. Upcoming = event date is today or later.
  function prepareEvent(ev) {
    const m = String(ev.date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    const key = m ? `${m[1]}-${m[2]}-${m[3]}` : '';
    let date = '', dateLong = '';
    if (m) {
      const d = new Date(+m[1], +m[2] - 1, +m[3]);
      date = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} ${d.getFullYear()}`;
      dateLong = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}${ev.time ? ', ' + ev.time : ''}`;
    }
    const upcoming = !!key && key >= todayKey();
    return { ...ev, key, date, dateLong, upcoming, tag: upcoming ? 'UPCOMING' : ev.tag, pos: ev.pos || 'center' };
  }
  // Upcoming soonest first, then past newest first.
  function prepareEvents(list) {
    return (list || []).map(prepareEvent).sort((a, b) =>
      a.upcoming !== b.upcoming ? (a.upcoming ? -1 : 1) : a.upcoming ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key));
  }

  const bg = (src, img) => `background-image:url('${esc(img(src))}')`;

  function heroSlidesHTML(images, img = siteImg) {
    return images.map((src, i) =>
      `<div class="hero__slide${i === 0 ? ' is-active' : ''}"><div class="hero__img" style="${bg(src, img)}"></div><div class="hero__tint"></div><div class="hero__vignette"></div></div>`).join('');
  }
  const heroDotsHTML = (n) => (n > 1 ? Array.from({ length: n }, (_, i) => `<span class="${i === 0 ? 'is-active' : ''}"></span>`).join('') : '');

  function artistHTML(a, i, img = siteImg) {
    const reverse = i % 2 === 1;
    const photo = a.img
      ? `<div class="artist__photo"><div class="artist__img${a.cutout ? ' artist__img--cutout' : ''}" role="img" aria-label="${esc(a.name)}" style="${bg(a.img, img)}"></div></div>`
      : `<div class="artist__photo artist__photo--placeholder"><span>photo: ${esc(a.name)}</span></div>`;
    return `<div class="artist${reverse ? ' artist--reverse' : ''}" data-dir="${reverse ? 1 : -1}">${photo}
        <div class="artist__text"><div class="artist__name">${esc(a.name)}</div><div class="rule"></div><p class="body">${esc(a.bio)}</p></div></div>`;
  }

  function upcomingHTML(ev, idx, img = siteImg) {
    return `<div class="upcoming" data-idx="${idx}">
          <div class="upcoming__poster" role="img" aria-label="${esc(ev.name)}" style="${bg(ev.image, img)};background-position:${esc(ev.pos)}"></div>
          <div class="upcoming__body">
            <div class="upcoming__date">${esc(ev.dateLong)}</div>
            <div class="upcoming__title">${esc(ev.name)}</div>
            <div class="upcoming__venue">${esc(ev.venue)}</div>
            ${ev.lineup ? `<div class="upcoming__lineup">Line-up: ${esc(ev.lineup)}</div>` : ''}
            <p class="body">${esc(ev.description)}</p>
            <div class="upcoming__actions">
              ${ev.tickets ? `<a class="btn btn--red" href="${esc(ev.tickets)}" target="_blank" rel="noopener" data-stop>GET TICKETS</a>` : ''}
              <span class="btn btn--outline">DETAILS</span>
            </div>
          </div>
        </div>`;
  }

  function cardHTML(ev, idx, img = siteImg) {
    return `<div class="card" data-idx="${idx}">
          <div class="card__poster" role="img" aria-label="${esc(ev.name)}" style="${bg(ev.image, img)};background-position:${esc(ev.pos)}"><div class="tag">${esc(ev.tag)}</div></div>
          <div class="card__body"><div class="card__date">${esc(ev.date)}</div><div class="card__title">${esc(ev.name)}</div><div class="card__venue">${esc(ev.venueShort)}</div></div>
        </div>`;
  }

  // Contents of .modal__card (the event pop-up).
  function modalHTML(ev, img = siteImg) {
    const meta = (label, v) => (v ? `<div><div class="meta-label">${label}</div><div>${esc(v)}</div></div>` : '');
    return `<button class="modal__close" data-close aria-label="Close">&times;</button>
      <div class="modal__poster" style="${bg(ev.image, img)}"></div>
      <div class="modal__body">
        <div class="tag">${esc(ev.tag)}</div>
        <div class="modal__title">${esc(ev.name)}</div>
        <div class="modal__meta">${meta('WHEN', ev.dateLong)}${meta('WHERE', ev.venue)}${meta('LINE-UP', ev.lineup)}${meta('HOSTED BY', ev.hosts)}</div>
        <p class="body">${esc(ev.description)}</p>
        <div class="modal__actions">
          ${ev.tickets ? `<a class="btn btn--red btn--solid btn--sm" href="${esc(ev.tickets)}" target="_blank" rel="noopener">GET TICKETS</a>` : ''}
          ${ev.fb ? `<a class="btn btn--outline-red btn--sm" href="${esc(ev.fb)}" target="_blank" rel="noopener">VIEW ON FACEBOOK</a>` : ''}
        </div>
      </div>`;
  }

  return { esc, siteImg, prepareEvent, prepareEvents, heroSlidesHTML, heroDotsHTML, artistHTML, upcomingHTML, cardHTML, modalHTML };
})();
