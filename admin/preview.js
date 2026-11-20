// Live previews in the admin: the right-hand pane renders the real site sections with the
// same builders the site uses (../render.js) and the site's own styles.css.
(function () {
  const BM = window.BM;
  const esc = BM.esc;

  CMS.registerPreviewStyle('/styles.css');
  CMS.registerPreviewStyle('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
  CMS.registerPreviewStyle(`
    body { background: #0a0a0a; }
    .artist { opacity: 1 !important; }
    .pv-note { position: sticky; top: 0; z-index: 50; display: flex; gap: 10px; align-items: center; padding: 12px 24px;
      background: rgba(5,5,5,.94); border-bottom: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(6px);
      font: 600 11px/1.4 Inter, sans-serif; letter-spacing: 2px; color: #9a9694; text-transform: uppercase; }
    .pv-note b { color: #f2f0ee; font-weight: 600; }
    .pv-dot { width: 8px; height: 8px; border-radius: 50%; background: #6b6866; flex: none; }
    .pv-dot--live { background: #e0333f; box-shadow: 0 0 0 4px rgba(224,51,63,.18); }
    .pv-label { margin: 56px 0 18px; }
    .pv-modal { margin: 0 auto; max-width: 1000px; }
    .pv-modal .modal__close { display: none; }
    .pv-modal .modal__poster { height: 60vh; }
    .pv-strip { display: flex; gap: 8px; justify-content: center; padding: 18px 24px 0; flex-wrap: wrap; }
    .pv-strip div { width: 72px; height: 48px; border-radius: 2px; background: #000 center/cover; opacity: .45; border: 1px solid transparent; }
    .pv-strip div.is-active { opacity: 1; border-color: #e0333f; }
    .pv-empty { padding: 80px 24px; text-align: center; color: #6b6866; font: 14px Inter, sans-serif; }
  `, { raw: true });

  // Resolves image paths, including freshly uploaded (not yet published) files.
  const imgResolver = (getAsset) => (p) => (p ? String(getAsset(p)) : '');
  const html = (s) => h('div', { dangerouslySetInnerHTML: { __html: s } });
  const note = (live, text) => `<div class="pv-note"><span class="pv-dot${live ? ' pv-dot--live' : ''}"></span><span>${text}</span></div>`;

  // ---- Event: the card exactly as on the site + the pop-up visitors get when they click it ----
  CMS.registerPreviewTemplate('events', createClass({
    render() {
      const data = this.props.entry.get('data').toJS();
      const img = imgResolver(this.props.getAsset);
      if (!data.name && !data.date) return html('<div class="pv-empty">Fill in the event on the left — the preview appears here.</div>');
      const ev = BM.prepareEvent(data);
      const status = !ev.key
        ? note(false, 'Pick a date to see where this event appears')
        : ev.upcoming
          ? note(true, '<b>Upcoming</b> · shown as the big featured card, with the TICKETS button')
          : note(false, '<b>Past event</b> · shown in the Past events grid');
      const card = ev.upcoming ? BM.upcomingHTML(ev, 0, img) : `<div class="past-grid">${BM.cardHTML(ev, 0, img)}</div>`;
      return html(`${status}
        <section class="section events">
          <div class="container">
            <div class="eyebrow eyebrow--left">${ev.upcoming ? 'UPCOMING' : 'PAST EVENTS'}</div>
            ${card}
            <div class="eyebrow eyebrow--left pv-label">POP-UP WHEN CLICKED</div>
            <div class="modal__card pv-modal">${BM.modalHTML(ev, img)}</div>
          </div>
        </section>`);
    },
  }));

  // ---- Artists: the whole artists section ----
  CMS.registerPreviewTemplate('artists', createClass({
    render() {
      const { artists = [] } = this.props.entry.get('data').toJS();
      const img = imgResolver(this.props.getAsset);
      return html(`${note(true, `<b>Artists section</b> · ${artists.length} artist${artists.length === 1 ? '' : 's'}, photos alternate left / right`)}
        <section class="section artists">
          <div class="section-head"><div class="eyebrow">THE LINEUP</div><h2 class="h2">Artists</h2></div>
          ${artists.map((a, i) => BM.artistHTML(a, i, img)).join('')}
        </section>`);
    },
  }));

  // ---- Page text: hero (with running slideshow), Who we are, Contact + footer ----
  const ICON_IG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f2f0ee" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1"/></svg>';
  const ICON_FB = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f2f0ee" stroke-width="1.8"><path d="M15 8h-2c-1 0-1.5.6-1.5 1.7V12H15l-.4 3h-2.1v7h-3v-7H8v-3h1.5V9.4C9.5 6.8 11 5 13.3 5H15v3z"/></svg>';

  CMS.registerPreviewTemplate('site', createClass({
    getInitialState() { return { slide: 0 }; },
    componentDidMount() { this.timer = setInterval(() => this.setState((s) => ({ slide: s.slide + 1 })), 6000); },
    componentWillUnmount() { clearInterval(this.timer); },
    render() {
      const s = this.props.entry.get('data').toJS();
      const img = imgResolver(this.props.getAsset);
      const images = (s.heroImages || []).map((x) => x && x.image).filter(Boolean);
      const cur = images.length ? this.state.slide % images.length : 0;
      const slides = images.map((p, i) => `<div class="hero__slide${i === cur ? ' is-active' : ''}"><div class="hero__img" style="background-image:url('${esc(img(p))}')"></div><div class="hero__tint"></div><div class="hero__vignette"></div></div>`).join('');
      const dots = images.length > 1 ? images.map((_, i) => `<span class="${i === cur ? 'is-active' : ''}"></span>`).join('') : '';
      const strip = images.length > 1
        ? `<div class="pv-strip">${images.map((p, i) => `<div class="${i === cur ? 'is-active' : ''}" style="background-image:url('${esc(img(p))}')"></div>`).join('')}</div>` : '';
      const tel = String(s.phone || '').replace(/[^+\d]/g, '');
      return html(`${note(true, `<b>Home page</b> · ${images.length > 1 ? `slideshow of ${images.length} photos, changes every 6 s` : images.length ? '1 hero photo (add another to start the slideshow)' : 'no hero photo yet'}`)}
        <section class="hero">
          <div class="hero__slides">${slides}</div>
          <div class="hero__fade"></div>
          <div class="hero__content">
            <div class="hero__glow"></div>
            <img class="hero__logo" src="/assets/logo.png" alt="BalkanMadness">
            <p class="hero__tagline">${esc(s.tagline)}</p>
            <div class="hero__ctas"><span class="btn btn--ghost">WHO WE ARE</span><span class="btn btn--red">TICKETS</span></div>
          </div>
          <div class="hero__dots">${dots}</div>
        </section>
        ${strip}
        <section class="section who"><div class="who__inner">
          <div class="eyebrow">WHO WE ARE</div>
          <h2 class="h2">${esc(s.whoHeading)}</h2>
          <p class="body-lg">${esc(s.whoText)}</p>
        </div></section>
        <section class="section contact"><div class="contact__inner">
          <div class="contact__info">
            <div class="eyebrow eyebrow--left">GET IN TOUCH</div>
            <h2 class="h2">Book us, ask us,<br>find us</h2>
            <p class="body">${esc(s.contactText)}</p>
            <div class="contact__lines">
              <a class="contact__email" href="mailto:${esc(s.email)}">${esc(s.email)}</a>
              <a href="tel:${esc(tel)}">${esc(s.phone)}</a>
              <div class="muted">${esc(s.address)}</div>
            </div>
            <div class="socials"><a href="${esc(s.instagram)}" target="_blank" rel="noopener">${ICON_IG}</a><a href="${esc(s.facebook)}" target="_blank" rel="noopener">${ICON_FB}</a></div>
          </div>
          <form class="contact__form" onsubmit="return false">
            <input type="text" placeholder="Your name"><input type="email" placeholder="Your email">
            <textarea rows="4" placeholder="Your message"></textarea>
            <button type="button" class="btn btn--red btn--solid">SEND MESSAGE</button>
          </form>
        </div>
        <footer class="footer"><div>© 2026 BalkanMadness. All rights reserved.</div><div>Breda &amp; Eindhoven, Netherlands</div></footer>
        </section>`);
    },
  }));
})();
