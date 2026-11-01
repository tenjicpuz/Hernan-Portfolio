(function () {
  'use strict';
  const GITHUB_USER = 'tenjicpuz';
  const $ = (id) => document.getElementById(id);
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Only allow safe link schemes in anything that comes from outside (database, GitHub).
  const safeUrl = (value) => { try { const u = new URL(String(value), location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : '#'; } catch (e) { return '#'; } };
  const sessionGet = (key) => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) { return null; } };
  const sessionSet = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {} };

  document.documentElement.classList.add('js');

  /* ---------- One shared Supabase client ---------- */
  const cfg = window.PORTFOLIO_CONFIG || {};
  const hasSupabase = !!(window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey && !String(cfg.supabaseUrl).includes('YOUR_'));
  const db = hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  /* ---------- Profile photos: drop a broken image so the initials show instead ---------- */
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const drop = () => img.remove();
    if (img.complete && img.naturalWidth === 0) drop(); else img.addEventListener('error', drop, { once: true });
  });

  /* ---------- Intro splash (once per session, skippable) ---------- */
  const splash = $('splash');
  if (splash) {
    let seen = false;
    try { seen = sessionStorage.getItem('hernan-splash') === '1'; } catch (e) {}
    const hideSplash = () => { splash.classList.add('done'); try { sessionStorage.setItem('hernan-splash', '1'); } catch (e) {} setTimeout(() => splash.remove(), 900); };
    if (seen || reduce) splash.remove();
    else { setTimeout(hideSplash, 2300); splash.addEventListener('click', hideSplash); document.addEventListener('keydown', hideSplash, { once: true }); }
  }

  $('print-resume').addEventListener('click', () => window.print());

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = Array.from(document.querySelectorAll('.block > .wrap > *'));
  revealTargets.forEach((el) => el.classList.add('reveal'));
  if (reduce || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); else io.observe(el);
    });
  }

  /* ---------- Scroll progress + back to top ---------- */
  const barFill = $('progress') && $('progress').firstElementChild;
  const toTop = $('to-top');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (barFill) barFill.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, h.scrollTop / max) : 0).toFixed(4) + ')';
      if (toTop) toTop.classList.toggle('show', h.scrollTop > 700);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Typing line (pauses while the tab is hidden) ---------- */
  const typed = $('typed');
  const phrases = ['BSIT Student', 'Full-Stack Developer', 'Supabase + PostgreSQL', 'Open to internships'];
  if (!reduce && typed) {
    let p = 0, i = 0, dir = 1;
    (function tick() {
      if (document.hidden) { setTimeout(tick, 600); return; }
      const word = phrases[p];
      i += dir;
      typed.textContent = word.slice(0, i);
      let wait = dir === 1 ? 85 : 40;
      if (dir === 1 && i === word.length) { dir = -1; wait = 1600; }
      else if (dir === -1 && i === 0) { dir = 1; p = (p + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    })();
  }

  /* ---------- Hanging ID card ----------
     The strap stays fixed; only the card swings, like a real badge on a clip.
     Move it by dragging, by tapping either side, by passing a mouse over it, or by tilting a phone (gyro).
     The animation loop only runs while the card is moving AND on screen, so a settled card costs nothing. */
  (function lanyard() {
    const swing = $('swing'), badge = $('badge'), box = $('lanyard'), gyroBtn = $('gyro-btn');
    if (!swing || reduce) return;
    const K = 16, C = 1.7, ARM = 290;
    let angle = 0.14, vel = 0, target = 0, dragging = false, startX = 0, startAngle = 0, moved = 0, downAt = 0;
    let lastX = 0, lastT = 0, flingVel = 0, last = 0, visible = true, running = false;
    // Never let the card swing past the edges of a narrow screen.
    const limit = () => Math.max(0.3, Math.min(0.55, Math.asin(Math.max(0, Math.min(1, (window.innerWidth / 2 - 115) / ARM)))));
    const clamp = (v) => Math.max(-limit(), Math.min(limit(), v));

    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (!dragging) {
        vel += (-K * (angle - target) - C * vel) * dt;
        angle = clamp(angle + vel * dt);
        if (Math.abs(angle - target) < 0.0008 && Math.abs(vel) < 0.002) { angle = target; vel = 0; }
      }
      swing.style.transform = 'rotate(' + angle.toFixed(4) + 'rad)';
      if ((!dragging && angle === target && vel === 0) || !visible || document.hidden) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    if ('IntersectionObserver' in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); }).observe(box);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

    // Dragging right moves the bottom of the card right (a negative rotation).
    badge.addEventListener('pointerdown', (e) => {
      dragging = true; moved = 0; downAt = performance.now(); startX = lastX = e.clientX; lastT = downAt; flingVel = 0; startAngle = angle;
      try { badge.setPointerCapture(e.pointerId); } catch (x) {}
      start();
    });
    badge.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (dragging) {
        moved = Math.max(moved, Math.abs(e.clientX - startX));
        const next = clamp(startAngle - (e.clientX - startX) / 220);
        if (now > lastT) flingVel = (next - angle) / ((now - lastT) / 1000);
        angle = next; vel = 0; lastX = e.clientX; lastT = now;
      } else if (e.pointerType === 'mouse') {
        // Brushing the card with the mouse gives it a small push.
        vel = Math.max(-5, Math.min(5, vel - (e.clientX - lastX) * 0.03)); lastX = e.clientX; start();
      }
    });
    badge.addEventListener('pointerenter', (e) => { lastX = e.clientX; });
    const release = (e) => {
      if (!dragging) return;
      dragging = false;
      try { badge.releasePointerCapture(e.pointerId); } catch (x) {}
      if (moved < 8 && performance.now() - downAt < 450) {
        // A tap pushes the card away from the side that was tapped.
        const r = badge.getBoundingClientRect();
        vel += (e.clientX >= r.left + r.width / 2 ? 1 : -1) * 2.4;
      } else {
        vel = Math.max(-6, Math.min(6, flingVel * 0.6));
      }
      start();
    };
    badge.addEventListener('pointerup', release); badge.addEventListener('pointercancel', release);

    /* ---- Gyro: the card hangs toward real gravity as the phone tilts ---- */
    let smooth = 0;
    function onTilt(e) {
      if (e.gamma == null && e.beta == null) return;
      const o = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
      const deg = o === 90 ? e.beta : (o === 270 || o === -90) ? -e.beta : o === 180 ? -e.gamma : e.gamma;
      smooth += ((-(deg || 0) * Math.PI / 180 * 0.9) - smooth) * 0.25;
      target = clamp(smooth);
      start();
    }
    function enableTilt() { window.addEventListener('deviceorientation', onTilt, true); }
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (typeof DeviceOrientationEvent !== 'undefined' && coarse) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS asks for permission, and only from a tap.
        gyroBtn.hidden = false;
        gyroBtn.addEventListener('click', () => {
          DeviceOrientationEvent.requestPermission().then((state) => {
            if (state === 'granted') { enableTilt(); gyroBtn.hidden = true; }
            else gyroBtn.textContent = 'Motion access was denied';
          }).catch(() => { gyroBtn.textContent = 'Tilt is not available'; });
        });
      } else {
        enableTilt(); // Android and other browsers: no prompt needed
      }
    }
    start();
  })();

  /* ---------- Nav highlight ---------- */
  const navLinks = Array.from(document.querySelectorAll('#main-navigation a'));
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + en.target.id)));
    }), { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Tabs ---------- */
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ---------- Project search + language filter (works on the built-in list and the live GitHub list) ---------- */
  const grid = $('project-grid'), search = $('project-search'), chipsBox = $('lang-chips'), countEl = $('project-count'), emptyEl = $('project-empty');
  let activeLang = 'All';
  function setupFilters() {
    const cards = Array.from(grid.querySelectorAll('.pcard'));
    const counts = {};
    cards.forEach((c) => {
      if (!c.dataset.lang) { const l = c.querySelector('.lang'); c.dataset.lang = l ? l.textContent.trim() : 'Project'; }
      counts[c.dataset.lang] = (counts[c.dataset.lang] || 0) + 1;
    });
    const langs = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    if (activeLang !== 'All' && !counts[activeLang]) activeLang = 'All';
    chipsBox.innerHTML = ['All'].concat(langs).map((l) =>
      '<button type="button" class="fchip" data-lang="' + escapeHtml(l) + '" aria-pressed="' + (l === activeLang) + '">' + escapeHtml(l) + (l === 'All' ? '' : ' <small>' + counts[l] + '</small>') + '</button>').join('');
    chipsBox.hidden = langs.length < 2;
    applyFilters();
  }
  function applyFilters() {
    const q = (search.value || '').trim().toLowerCase();
    let shown = 0;
    const cards = Array.from(grid.querySelectorAll('.pcard'));
    cards.forEach((c) => {
      const ok = (activeLang === 'All' || c.dataset.lang === activeLang) && (!q || c.textContent.toLowerCase().includes(q));
      c.hidden = !ok; if (ok) shown++;
    });
    countEl.textContent = shown === cards.length ? cards.length + (cards.length === 1 ? ' project' : ' projects') : shown + ' of ' + cards.length + ' projects';
    emptyEl.hidden = shown !== 0;
  }
  chipsBox.addEventListener('click', (e) => {
    const b = e.target.closest('.fchip'); if (!b) return;
    activeLang = b.dataset.lang;
    chipsBox.querySelectorAll('.fchip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    applyFilters();
  });
  let searchTimer;
  search.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(applyFilters, 120); });
  setupFilters();

  /* ---------- GitHub: ONE request feeds both the summary and projects ---------- */
  const CACHE_MS = 15 * 60 * 1000;
  const GH_HEADERS = { Accept: 'application/vnd.github+json' };
  async function cachedJson(key, urls) {
    const cached = sessionGet(key);
    if (cached && Date.now() - cached.t < CACHE_MS) return cached.d;
    const res = await Promise.all(urls.map((u) => fetch(u, { headers: GH_HEADERS })));
    if (res.some((r) => !r.ok)) throw new Error('GitHub API unavailable');
    const data = await Promise.all(res.map((r) => r.json()));
    sessionSet(key, { t: Date.now(), d: data });
    return data;
  }
  const monthYear = (iso) => new Date(iso).toLocaleDateString('en', { month: 'short', year: 'numeric' });
  function ago(iso) {
    const s = (new Date(iso) - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, sec] of steps) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), unit);
    return 'just now';
  }

  // Short, hand-written descriptions take priority over whatever the GitHub description says.
  const CURATED = {
    'opendriverupdater': 'A transparent, zero-dependency batch script that backs up and updates drivers on Windows 10 and 11.',
    'code-archaeologist': 'Evidence-grounded code intelligence for developers.',
    'snake-game-but-in-relapse': 'A snake game written in Python.',
    'book-of-guides': 'A collection of written how-to guides.'
  };

  cachedJson('hernan-portfolio-gh-v1', [
    'https://api.github.com/users/' + GITHUB_USER,
    'https://api.github.com/users/' + GITHUB_USER + '/repos?sort=updated&per_page=100'
  ]).then(([profile, repos]) => {
    const own = repos.filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== GITHUB_USER + '.github.io');
    $('github-repo-count').textContent = profile.public_repos;
    const langs = {};
    own.forEach((r) => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
    const top = Object.keys(langs).sort((a, b) => langs[b] - langs[a])[0];
    $('github-top-language').textContent = top || '–';
    const latest = repos.map((r) => r.pushed_at).filter(Boolean).sort().pop();
    $('github-last-push').textContent = latest ? monthYear(latest) : '–';

    const projects = own.slice().sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 8);
    if (!projects.length) return;
    grid.innerHTML = projects.map((r) => {
      const link = escapeHtml(safeUrl(r.html_url));
      const desc = CURATED[r.name.toLowerCase()] || r.description || 'Independent project. Source code and details are on GitHub.';
      const lang = r.language || 'Project';
      const meta = (r.stargazers_count ? '<span class="stars">&#9733; ' + Number(r.stargazers_count) + '</span> ' : '') + (r.pushed_at ? 'Updated ' + escapeHtml(monthYear(r.pushed_at)) : '');
      return '<li class="pcard" data-lang="' + escapeHtml(lang) + '"><div class="pcard-top"><span class="lang">' + escapeHtml(lang) + '</span><span>' + meta + '</span></div><h3>' + escapeHtml(r.name) + '</h3><p>' +
        escapeHtml(desc) + '</p><a class="btn" href="' + link + '" target="_blank" rel="noopener noreferrer">View source &#8599;</a></li>';
    }).join('');
    setupFilters();
  }).catch((e) => console.info('Showing the built-in project list; GitHub data unavailable.', e));

  /* ---------- Recent GitHub activity ---------- */
  cachedJson('hernan-portfolio-gh-events-v1', ['https://api.github.com/users/' + GITHUB_USER + '/events/public?per_page=30'])
    .then(([events]) => {
      if (!Array.isArray(events)) return;
      const merged = new Map();
      events.forEach((e) => {
        const isPush = e.type === 'PushEvent';
        const isNewRepo = e.type === 'CreateEvent' && e.payload && e.payload.ref_type === 'repository';
        if (!(isPush || isNewRepo) || !e.repo || !e.repo.name) return;
        const key = e.type + '|' + e.repo.name + '|' + String(e.created_at).slice(0, 10);
        if (!merged.has(key)) merged.set(key, e);
      });
      const items = Array.from(merged.values()).slice(0, 5);
      if (!items.length) return;
      $('activity-list').innerHTML = items.map((e) => {
        const name = String(e.repo.name);
        const short = name.indexOf('/') > -1 ? name.split('/').slice(1).join('/') : name;
        const verb = e.type === 'PushEvent' ? 'pushed to ' : 'created ';
        return '<li><span>' + verb + '<a href="' + escapeHtml(safeUrl('https://github.com/' + name)) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(short) + '</a></span><span class="when">' + escapeHtml(ago(e.created_at)) + '</span></li>';
      }).join('');
      $('activity').hidden = false;
    }).catch(() => { /* optional extra: stay hidden if GitHub is unreachable or rate-limited */ });

  /* ---------- Certificates (images open in a preview you can step through, PDFs open in a new tab) ---------- */
  const dialog = $('cert-dialog');
  let certList = [], certIdx = 0;
  function showCert(i) {
    if (!certList.length) return;
    certIdx = (i + certList.length) % certList.length;
    const c = certList[certIdx];
    $('cert-img').src = c.src; $('cert-img').alt = c.title;
    $('cert-cap').textContent = c.title + (certList.length > 1 ? '  (' + (certIdx + 1) + '/' + certList.length + ')' : '');
    $('cert-prev').hidden = $('cert-next').hidden = certList.length < 2;
  }
  $('cert-close').addEventListener('click', () => dialog.close());
  $('cert-prev').addEventListener('click', () => showCert(certIdx - 1));
  $('cert-next').addEventListener('click', () => showCert(certIdx + 1));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); showCert(certIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showCert(certIdx + 1); }
  });
  dialog.addEventListener('close', () => { $('cert-img').removeAttribute('src'); });

  (async function loadCertificates() {
    const gallery = $('certificate-gallery');
    if (!db) { gallery.innerHTML = '<p class="empty-certificates">Certificates are temporarily unavailable.</p>'; return; }
    const { data, error } = await db.from('certificates').select('id,title,issuer,issued_on,public_url,storage_path').order('created_at', { ascending: false });
    if (error) { console.info('Certificates could not be loaded.', error); gallery.innerHTML = '<p class="empty-certificates">Certificates could not be loaded right now. Please try again later.</p>'; return; }
    if (!data || !data.length) { gallery.innerHTML = '<p class="empty-certificates">No certificates have been added yet.</p>'; return; }
    certList = [];
    gallery.innerHTML = data.map((item) => {
      const url = escapeHtml(safeUrl(item.public_url));
      const isPdf = /\.pdf$/i.test(item.storage_path || '');
      let media;
      if (isPdf) {
        media = '<a href="' + url + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + escapeHtml(item.title) + '"><div class="pdf-thumb" aria-hidden="true">PDF</div></a>';
      } else {
        certList.push({ src: safeUrl(item.public_url), title: item.title || 'Certificate' });
        media = '<button type="button" class="cert-open" data-idx="' + (certList.length - 1) + '" aria-label="Preview ' + escapeHtml(item.title) + '"><img src="' + url + '" alt="' + escapeHtml(item.title) + '" loading="lazy" decoding="async"></button>';
      }
      return '<article class="certificate-card">' + media + '<div class="certificate-info"><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.issuer || 'Certificate') + (item.issued_on ? ', ' + escapeHtml(item.issued_on) : '') + '</p></div></article>';
    }).join('');
    gallery.querySelectorAll('.cert-open').forEach((b) => b.addEventListener('click', () => { showCert(Number(b.dataset.idx)); dialog.showModal(); }));
  })();

  /* ---------- Public contact links + managed content (read-only, no admin UI here) ---------- */
  const hrefFor = (item) => item.type === 'email' ? 'mailto:' + item.value : item.type === 'phone' ? 'tel:' + String(item.value).replace(/[^+0-9]/g, '') : safeUrl(item.value);
  (async function loadContactLinks() {
    if (!db) return;
    const { data, error } = await db.from('contact_links').select('id,label,category,type,value').order('sort_order').order('created_at');
    if (error || !data || !data.length) return;
    $('contact-links').innerHTML = data.map((item) => '<p><strong>' + escapeHtml(item.label) + '</strong><a href="' + escapeHtml(hrefFor(item)) + '"' + (item.type === 'url' ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + escapeHtml(item.value) + '</a></p>').join('');
  })();

  (async function loadManagedContent() {
    if (!db) return;
    try {
      const { data, error } = await db.from('portfolio_content').select('section,title,subtitle,description,url,image_url,display_date,sort_order').eq('is_published', true).order('sort_order');
      if (error || !data || !data.length) return;
      const groups = {};
      data.forEach((item) => { (groups[item.section] = groups[item.section] || []).push(item); });
      const wrap = document.createElement('section');
      wrap.id = 'managed-portfolio-content';
      wrap.className = 'managed-content';
      wrap.innerHTML = '<div class="wrap"><div class="center"><h2 class="big">More</h2></div>' + Object.keys(groups).map((name) =>
        '<h3>' + escapeHtml(name) + '</h3><div class="managed-grid">' + groups[name].map((x) =>
          '<article class="managed-card">' + (x.image_url ? '<img src="' + escapeHtml(safeUrl(x.image_url)) + '" alt="" loading="lazy" decoding="async">' : '') +
          '<h4>' + escapeHtml(x.title) + '</h4>' + (x.subtitle ? '<p>' + escapeHtml(x.subtitle) + '</p>' : '') + (x.description ? '<p>' + escapeHtml(x.description) + '</p>' : '') +
          (x.display_date ? '<small>' + escapeHtml(x.display_date) + '</small>' : '') +
          (x.url ? '<p><a href="' + escapeHtml(safeUrl(x.url)) + '" target="_blank" rel="noopener noreferrer">View details &#8599;</a></p>' : '') + '</article>').join('') + '</div>').join('') + '</div>';
      const contact = $('contact');
      contact.parentNode.insertBefore(wrap, contact);
    } catch (e) { console.warn('Managed content could not load', e); }
  })();

  /* ---------- Profile picture (changed from the admin dashboard) ----------
     The newest image in the public "certificates" bucket, folder profile/, replaces the GitHub picture
     on the ID card and in the About section. If there is none, or anything fails, the GitHub picture stays. */
  (async function loadProfilePicture() {
    if (!db) return;
    try {
      const { data, error } = await db.storage.from('certificates').list('profile', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error || !data) return;
      const files = data.filter((f) => f.id && /\.(webp|jpe?g|png)$/i.test(f.name))
        .sort((a, b) => (new Date(b.created_at) - new Date(a.created_at)) || (a.name < b.name ? 1 : a.name > b.name ? -1 : 0));
      if (!files.length) return;
      const url = db.storage.from('certificates').getPublicUrl('profile/' + files[0].name).data.publicUrl;
      const probe = new Image();
      probe.onload = () => document.querySelectorAll('.photo, .portrait').forEach((box) => {
        let img = box.querySelector('img');
        if (!img) { img = document.createElement('img'); img.alt = ''; img.decoding = 'async'; img.draggable = false; box.appendChild(img); }
        img.src = url;
      });
      probe.src = url;
    } catch (e) { console.info('Using the default profile picture.', e); }
  })();
})();
