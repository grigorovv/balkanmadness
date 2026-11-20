(async function () {
  const $ = (id) => document.getElementById(id);

  // ---- Content (edited by the owners in /admin) ----
  // content/events.json is generated from content/events/*.json by scripts/build-content.js (runs on every Netlify deploy).
  const load = (name) => fetch(`content/${name}.json`, { cache: 'no-cache' }).then((r) => r.json());
  const [SITE, { artists: ARTISTS = [] }, { events: ALL_EVENTS = [] }] = await Promise.all([load('site'), load('artists'), load('events')]);
  const EVENTS = BM.prepareEvents(ALL_EVENTS);
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
  slides.innerHTML = BM.heroSlidesHTML(HERO_IMAGES);
  dots.innerHTML = BM.heroDotsHTML(HERO_IMAGES.length);
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
  $('artistList').innerHTML = ARTISTS.map((a, i) => BM.artistHTML(a, i)).join('');

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
  $('upcomingList').innerHTML = EVENTS.map((ev, i) => (ev.upcoming ? BM.upcomingHTML(ev, i) : '')).join('')
    || '<p class="body">New dates coming soon — follow us on Instagram and Facebook.</p>';
  $('pastList').innerHTML = EVENTS.map((ev, i) => (ev.upcoming ? '' : BM.cardHTML(ev, i))).join('');

  // ---- Modal ----
  const modal = $('modal');
  function openEvent(i) {
    $('modalCard').innerHTML = BM.modalHTML(EVENTS[i]);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeEvent() { modal.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return closeEvent();
    if (e.target.closest('[data-stop]')) return;
    const card = e.target.closest('[data-idx]');
    if (card) openEvent(Number(card.dataset.idx));
  });
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
