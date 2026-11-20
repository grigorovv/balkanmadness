(async function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // CMS stores root-relative paths ("/assets/..."); make them relative so the site also works from a subfolder.
  const url = (src) => esc(String(src || '').replace(/^\//, ''));

  // ---- Content (edited by the owners in /admin, stored in content/*.json) ----
  const load = (name) => fetch(`content/${name}.json`, { cache: 'no-cache' }).then((r) => r.json());
  const [SITE, { artists: ARTISTS = [] }, { events: ALL_EVENTS = [] }] = await Promise.all([load('site'), load('artists'), load('events')]);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const EVENTS = ALL_EVENTS.map((ev) => {
    const m = String(ev.date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    const key = m ? `${m[1]}-${m[2]}-${m[3]}` : '';
    let date = '', dateLong = '';
    if (m) {
      const d = new Date(+m[1], +m[2] - 1, +m[3]);
      date = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} ${d.getFullYear()}`;
      dateLong = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}${ev.time ? ', ' + ev.time : ''}`;
    }
    const upcoming = key >= today;
    return { ...ev, key, date, dateLong, upcoming, tag: upcoming ? 'UPCOMING' : ev.tag, pos: ev.pos || 'center' };
  });
  // Upcoming: soonest first. Past: newest first. Upcoming/past is decided by the event date automatically.
  EVENTS.sort((a, b) => (a.upcoming !== b.upcoming ? (a.upcoming ? -1 : 1) : a.upcoming ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)));
  const HERO_IMAGES = (SITE.heroImages || []).map((h) => h.image).filter(Boolean);

  // ---- Page text ----
  const setText = (id, v) => { if (v) $(id).textContent = v; };
  setText('heroTagline', SITE.tagline);
  setText('whoHeading', SITE.whoHeading);
  setText('whoText', SITE.whoText);
  setText('contactText', SITE.contactText);
  if (SITE.email) { setText('contactEmail', SITE.email); $('contactEmail').href = `mailto:${SITE.email}`; }
  if (SITE.phone) { setText('contactPhone', SITE.phone); $('contactPhone').href = `tel:${SITE.phone.replace(/[^+\d]/g, '')}`; }
  setText('contactAddress', SITE.address);
  if (SITE.instagram) $('socialInstagram').href = SITE.instagram;
  if (SITE.facebook) $('socialFacebook').href = SITE.facebook;
  const nextTickets = SITE.ticketsUrl || (EVENTS.find((e) => e.upcoming && e.tickets) || {}).tickets;
  if (nextTickets) $('heroTickets').href = nextTickets;

  // ---- Hero crossfade ----
  const slides = $('heroSlides'), dots = $('heroDots');
  HERO_IMAGES.forEach((src, i) => {
    slides.insertAdjacentHTML('beforeend',
      `<div class="hero__slide${i === 0 ? ' is-active' : ''}"><div class="hero__img" style="background-image:url('${url(src)}')"></div><div class="hero__tint"></div><div class="hero__vignette"></div></div>`);
    if (HERO_IMAGES.length > 1) dots.insertAdjacentHTML('beforeend', `<span class="${i === 0 ? 'is-active' : ''}"></span>`);
  });
  if (HERO_IMAGES.length > 1) {
    let cur = 0;
    setInterval(() => {
      const s = slides.children, d = dots.children;
      s[cur].classList.remove('is-active'); d[cur].classList.remove('is-active');
      cur = (cur + 1) % s.length;
      s[cur].classList.add('is-active'); d[cur].classList.add('is-active');
    }, 6000);
  }

  // ---- Artists ----
  const artistList = $('artistList');
  ARTISTS.forEach((a, i) => {
    const reverse = i % 2 === 1;
    const photo = a.img
      ? `<div class="artist__photo"><div class="artist__img${a.cutout ? ' artist__img--cutout' : ''}" role="img" aria-label="${esc(a.name)}" style="background-image:url('${url(a.img)}')"></div></div>`
      : `<div class="artist__photo artist__photo--placeholder"><span>photo: ${esc(a.name)}</span></div>`;
    artistList.insertAdjacentHTML('beforeend',
      `<div class="artist${reverse ? ' artist--reverse' : ''}" data-dir="${reverse ? 1 : -1}">${photo}
        <div class="artist__text"><div class="artist__name">${esc(a.name)}</div><div class="rule"></div><p class="body">${esc(a.bio)}</p></div></div>`);
  });

  // Scroll-linked reveal: progress 0→1 as row center moves from 110% to 60% of viewport height. Reverses on scroll up.
  const rows = [...document.querySelectorAll('.artist')];
  let ticking = false;
  function updateArtists() {
    const vh = window.innerHeight, start = vh * 1.1, end = vh * 0.6;
    rows.forEach((el) => {
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const p = Math.max(0, Math.min(1, (start - center) / (start - end)));
      el.style.opacity = p;
      el.style.transform = `translateX(${(1 - p) * 40 * Number(el.dataset.dir)}px)`;
    });
    ticking = false;
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateArtists); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateArtists();

  // ---- Events ----
  const up = $('upcomingList'), past = $('pastList');
  EVENTS.forEach((ev, i) => {
    if (ev.upcoming) {
      up.insertAdjacentHTML('beforeend',
        `<div class="upcoming" data-idx="${i}">
          <div class="upcoming__poster" role="img" aria-label="${esc(ev.name)}" style="background-image:url('${url(ev.img)}');background-position:${esc(ev.pos)}"></div>
          <div class="upcoming__body">
            <div class="upcoming__date">${esc(ev.dateLong)}</div>
            <div class="upcoming__title">${esc(ev.name)}</div>
            <div class="upcoming__venue">${esc(ev.venue)}</div>
            <div class="upcoming__lineup">Line-up: ${esc(ev.lineup)}</div>
            <p class="body">${esc(ev.description)}</p>
            <div class="upcoming__actions">
              ${ev.tickets ? `<a class="btn btn--red" href="${esc(ev.tickets)}" target="_blank" rel="noopener" data-stop>GET TICKETS</a>` : ''}
              <span class="btn btn--outline">DETAILS</span>
            </div>
          </div>
        </div>`);
    } else {
      past.insertAdjacentHTML('beforeend',
        `<div class="card" data-idx="${i}">
          <div class="card__poster" role="img" aria-label="${esc(ev.name)}" style="background-image:url('${url(ev.img)}');background-position:${esc(ev.pos)}"><div class="tag">${esc(ev.tag)}</div></div>
          <div class="card__body"><div class="card__date">${esc(ev.date)}</div><div class="card__title">${esc(ev.name)}</div><div class="card__venue">${esc(ev.venueShort)}</div></div>
        </div>`);
    }
  });

  if (!EVENTS.some((e) => e.upcoming)) up.innerHTML = '<p class="body">New dates coming soon — follow us on Instagram and Facebook.</p>';

  // ---- Modal ----
  const modal = $('modal');
  function openEvent(i) {
    const ev = EVENTS[i];
    $('modalPoster').style.backgroundImage = `url('${url(ev.img)}')`;
    $('modalTag').textContent = ev.tag;
    $('modalTitle').textContent = ev.name;
    $('modalWhen').textContent = ev.dateLong;
    $('modalWhere').textContent = ev.venue;
    $('modalLineup').textContent = ev.lineup;
    $('modalHosts').textContent = ev.hosts;
    $('modalDesc').textContent = ev.description;
    const t = $('modalTickets');
    t.hidden = !ev.tickets; if (ev.tickets) t.href = ev.tickets;
    const fb = $('modalFb');
    fb.hidden = !ev.fb; if (ev.fb) fb.href = ev.fb;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeEvent() { modal.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-stop]')) return;
    const card = e.target.closest('[data-idx]');
    if (card) openEvent(Number(card.dataset.idx));
  });
  $('modalClose').addEventListener('click', closeEvent);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeEvent(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeEvent(); });

  // ---- Contact form (placeholder — not connected to a backend) ----
  $('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = 'SENT!';
    setTimeout(() => { btn.textContent = 'SEND MESSAGE'; e.target.reset(); }, 2000);
  });
})();
