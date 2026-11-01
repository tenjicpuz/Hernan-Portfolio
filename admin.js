(function () {
  'use strict';
  // Must match the UID in is_portfolio_owner() inside supabase_setup.sql.
  // This is NOT a secret and NOT what protects your data: the database policies do.
  // It only decides which screen to show.
  const OWNER_ID = '95f82a16-c195-44d0-88fd-e3b648ea0e12';
  const BUCKET = 'certificates';
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
  const MAX_BYTES = 10 * 1024 * 1024;

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const say = (msg, ok) => { const s = $('status'); s.textContent = msg; s.classList.toggle('ok', !!ok); };

  const cfg = window.PORTFOLIO_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) { say('Supabase is not configured. Check config.js.'); return; }
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  /* ---------- Auth ---------- */
  async function refreshSession() {
    const { data } = await db.auth.getSession();
    const user = data.session && data.session.user;
    if (user && user.id !== OWNER_ID) {
      await db.auth.signOut();
      say('This account is not authorized to manage the portfolio.');
      $('login').classList.remove('hidden'); $('app').classList.add('hidden');
      return;
    }
    const signedIn = !!user;
    $('login').classList.toggle('hidden', signedIn);
    $('app').classList.toggle('hidden', !signedIn);
    if (signedIn) { $('who').textContent = 'Signed in as ' + (user.email || 'owner'); await loadAll(); }
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    say('Signing in…');
    const { error } = await db.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    $('password').value = '';
    if (error) { say('Sign-in failed. Check your email and password.'); return; }
    say(''); await refreshSession();
  });
  $('logout').addEventListener('click', async () => { await db.auth.signOut(); say('Signed out.', true); await refreshSession(); });

  /* ---------- Tabs ---------- */
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('active', x === b));
    ['certs', 'links', 'content', 'profile'].forEach((v) => $('view-' + v).classList.toggle('hidden', v !== b.dataset.view));
  }));

  /* ---------- Metrics ---------- */
  async function count(table, filter) {
    let q = db.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count: n } = await q;
    return n == null ? '—' : n;
  }
  async function loadMetrics() {
    const [certs, links, pub, all] = await Promise.all([
      count('certificates'), count('contact_links'),
      count('portfolio_content', (q) => q.eq('is_published', true)), count('portfolio_content')
    ]);
    $('m-certs').textContent = certs; $('m-links').textContent = links; $('m-pub').textContent = pub;
    $('m-draft').textContent = (typeof all === 'number' && typeof pub === 'number') ? all - pub : '—';
  }

  /* ---------- Certificates ---------- */
  async function loadCerts() {
    const { data, error } = await db.from('certificates').select('id,title,issuer,issued_on,storage_path,public_url').order('created_at', { ascending: false });
    if (error) { say(error.message); return; }
    $('certList').innerHTML = data.length ? data.map((c) =>
      '<div class="item"><div><b>' + esc(c.title) + '</b><p><small>' + esc(c.issuer || '') + (c.issued_on ? ' · ' + esc(c.issued_on) : '') +
      '</small></p></div><div><button class="danger" type="button" data-del-cert="' + esc(c.id) + '" data-path="' + esc(c.storage_path) + '">Delete</button></div></div>'
    ).join('') : '<p>No certificates yet.</p>';
  }
  $('certForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('c-save'); btn.disabled = true;
    let uploaded = null;
    try {
      const file = $('c-file').files[0];
      if (!file) throw new Error('Choose a file first.');
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Only PDF, PNG, JPG and WEBP files are allowed.');
      if (file.size > MAX_BYTES) throw new Error('File must be 10 MB or smaller.');
      const extMap = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
      const path = crypto.randomUUID() + '.' + extMap[file.type];
      say('Uploading…');
      const up = await db.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
      if (up.error) throw up.error;
      uploaded = path;
      const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
      const { error } = await db.from('certificates').insert({
        title: $('c-title').value.trim(), issuer: $('c-issuer').value.trim() || null,
        issued_on: $('c-date').value || null, storage_path: path, public_url: pub.publicUrl
      });
      if (error) throw error;
      uploaded = null; e.target.reset(); say('Certificate uploaded and published.', true);
      await Promise.all([loadCerts(), loadMetrics()]);
    } catch (err) {
      if (uploaded) await db.storage.from(BUCKET).remove([uploaded]);
      say(err.message || 'Upload failed.');
    } finally { btn.disabled = false; }
  });
  $('certList').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-del-cert]'); if (!b) return;
    if (!confirm('Delete this certificate from the public gallery?')) return;
    b.disabled = true;
    const { error } = await db.from('certificates').delete().eq('id', b.dataset.delCert);
    if (error) { say(error.message); b.disabled = false; return; }
    const { error: fe } = await db.storage.from(BUCKET).remove([b.dataset.path]);
    say(fe ? 'Record deleted, but file cleanup failed: ' + fe.message : 'Certificate deleted.', !fe);
    await Promise.all([loadCerts(), loadMetrics()]);
  });

  /* ---------- Contact links ---------- */
  async function loadLinks() {
    const { data, error } = await db.from('contact_links').select('id,label,category,type,value').order('sort_order').order('created_at');
    if (error) { say(error.message); return; }
    $('linkList').innerHTML = data.length ? data.map((l) =>
      '<div class="item"><div><b>' + esc(l.label) + '</b><p><small>' + esc(l.category) + ' · ' + esc(l.type) + ' · ' + esc(l.value) +
      '</small></p></div><div><button class="danger" type="button" data-del-link="' + esc(l.id) + '">Delete</button></div></div>'
    ).join('') : '<p>No contact links yet.</p>';
  }
  $('l-type').addEventListener('change', () => {
    const t = $('l-type').value;
    $('l-value').type = t === 'email' ? 'email' : t === 'phone' ? 'tel' : 'url';
    $('l-value').placeholder = t === 'email' ? 'you@example.com' : t === 'phone' ? '+63 900 000 0000' : 'https://...';
  });
  $('linkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('l-save'); btn.disabled = true;
    try {
      const item = { label: $('l-label').value.trim(), category: $('l-category').value.trim() || 'social', type: $('l-type').value, value: $('l-value').value.trim() };
      if (item.type === 'url' && !/^https?:\/\//i.test(item.value)) throw new Error('Enter a full URL starting with https:// or http://');
      if (item.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.value)) throw new Error('Enter a valid email address.');
      if (item.type === 'phone' && !/^[+0-9()\-\s]{6,}$/.test(item.value)) throw new Error('Enter a valid phone number.');
      const { error } = await db.from('contact_links').insert(item);
      if (error) throw error;
      e.target.reset(); $('l-category').value = 'social'; say('Link added.', true);
      await Promise.all([loadLinks(), loadMetrics()]);
    } catch (err) { say(err.message || 'Could not add link.'); }
    finally { btn.disabled = false; }
  });
  $('linkList').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-del-link]'); if (!b) return;
    if (!confirm('Delete this link?')) return;
    const { error } = await db.from('contact_links').delete().eq('id', b.dataset.delLink);
    say(error ? error.message : 'Link deleted.', !error);
    await Promise.all([loadLinks(), loadMetrics()]);
  });

  /* ---------- Extra content (only sections the public page actually shows) ---------- */
  const SECTIONS = {
    'Resume / CV': ['Resume title *', 'Version / file type', 'Summary', 'Public PDF URL', 'Preview image URL', 'Paste the public link to your resume PDF.'],
    'Experience': ['Role *', 'Company / type', 'Responsibilities and achievements', 'Company URL', 'Logo URL', 'Work or volunteer experience.'],
    'Achievements & Awards': ['Award *', 'Awarding body', 'Details', 'Proof URL', 'Image URL', 'Awards, recognitions, competition results.'],
    'Testimonials': ['Person name *', 'Role / organization', 'Testimonial text', 'Profile URL', 'Photo URL', 'Only publish testimonials you have permission to share.'],
    'Blog / Articles': ['Article title *', 'Category', 'Excerpt', 'Article URL', 'Featured image URL', 'Short articles or write-ups.'],
    'Extra Projects': ['Project name *', 'Tech / category', 'Description', 'Live demo or repo URL', 'Screenshot URL', 'Projects not on GitHub.']
  };
  let current = Object.keys(SECTIONS)[0];

  function applyGuide() {
    const g = SECTIONS[current];
    $('editorHeading').textContent = current;
    $('titleLabel').textContent = g[0]; $('subtitleLabel').textContent = g[1]; $('descriptionLabel').textContent = g[2];
    $('urlLabel').textContent = g[3]; $('imageLabel').textContent = g[4]; $('editorHint').textContent = g[5];
    $('listTitle').textContent = current + ' entries';
  }
  function renderSectionTabs() {
    $('sections').innerHTML = Object.keys(SECTIONS).map((s) => '<button type="button" data-section="' + esc(s) + '" class="' + (s === current ? 'active' : '') + '">' + esc(s) + '</button>').join('');
  }
  function clearForm() { $('editor').reset(); $('recordId').value = ''; $('sort').value = '0'; $('isPublished').checked = true; }
  async function loadContent() {
    renderSectionTabs(); applyGuide();
    const { data, error } = await db.from('portfolio_content').select('*').eq('section', current).order('sort_order').order('created_at', { ascending: false });
    if (error) { say(error.message); return; }
    $('records').innerHTML = data.length ? data.map((x) =>
      '<div class="item"><div><b>' + esc(x.title) + '</b><p><small>' + esc(x.subtitle || '') + (x.is_published ? ' · Published' : ' · Draft') + '</small></p><small>' + esc((x.description || '').slice(0, 140)) + '</small></div>' +
      '<div><button class="secondary" type="button" data-edit="' + esc(x.id) + '">Edit</button><button class="danger" type="button" data-del="' + esc(x.id) + '">Delete</button></div></div>'
    ).join('') : '<p>No entries in this section yet.</p>';
  }
  $('sections').addEventListener('click', (e) => { const b = e.target.closest('[data-section]'); if (!b) return; current = b.dataset.section; clearForm(); loadContent(); });
  $('clear').addEventListener('click', clearForm);
  $('editor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('save'); btn.disabled = true;
    const payload = {
      section: current, title: $('title').value.trim(), subtitle: $('subtitle').value.trim() || null,
      description: $('description').value.trim() || null, url: $('url').value.trim() || null, image_url: $('image').value.trim() || null,
      display_date: $('date').value || null, sort_order: Number($('sort').value) || 0, is_published: $('isPublished').checked
    };
    const id = $('recordId').value;
    const { error } = id ? await db.from('portfolio_content').update(payload).eq('id', id) : await db.from('portfolio_content').insert(payload);
    btn.disabled = false;
    if (error) { say(error.message); return; }
    say('Saved.', true); clearForm(); await Promise.all([loadContent(), loadMetrics()]);
  });
  $('records').addEventListener('click', async (e) => {
    const edit = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (edit) {
      const { data, error } = await db.from('portfolio_content').select('*').eq('id', edit.dataset.edit).single();
      if (error) { say(error.message); return; }
      $('recordId').value = data.id; $('title').value = data.title || ''; $('subtitle').value = data.subtitle || '';
      $('description').value = data.description || ''; $('url').value = data.url || ''; $('image').value = data.image_url || '';
      $('date').value = data.display_date || ''; $('sort').value = data.sort_order == null ? 0 : data.sort_order; $('isPublished').checked = !!data.is_published;
      $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (del && confirm('Permanently delete this entry?')) {
      const { error } = await db.from('portfolio_content').delete().eq('id', del.dataset.del);
      say(error ? error.message : 'Deleted.', !error);
      await Promise.all([loadContent(), loadMetrics()]);
    }
  });

  /* ---------- Profile picture ---------- */
  // The picture is stored in the existing public "certificates" bucket, inside a profile/ folder,
  // so no database change is needed. The public page shows the newest file in that folder and
  // falls back to the GitHub picture when the folder is empty.
  const PROFILE_DIR = 'profile';
  const DEFAULT_PICTURE = 'https://github.com/tenjicpuz.png'; // the same default the public page ships with
  const PIC_MAX_INPUT = 25 * 1024 * 1024;
  const sayPic = (msg, ok) => { const s = $('p-status'); s.textContent = msg; s.classList.toggle('ok', !!ok); };
  const picState = { custom: false, editing: false };
  const pic = { img: null, url: null, cx: 0, cy: 0, zoom: 1, drag: null };
  const cv = $('p-canvas'), cctx = cv.getContext('2d');
  const newCard = $('p-new-card'), newRound = $('p-new-round');
  // Newest first. The public page uses the exact same ordering.
  const newest = (a, b) => (new Date(b.created_at) - new Date(a.created_at)) || (a.name < b.name ? 1 : a.name > b.name ? -1 : 0);
  const pictureUrl = (name) => db.storage.from(BUCKET).getPublicUrl(PROFILE_DIR + '/' + name).data.publicUrl;

  async function listProfileFiles() {
    const { data, error } = await db.storage.from(BUCKET).list(PROFILE_DIR, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw error;
    return (data || []).filter((f) => f.id && /\.(webp|jpe?g|png)$/i.test(f.name)).sort(newest);
  }

  function syncPicUi() {
    const ed = picState.editing;
    $('p-editor').classList.toggle('hidden', !ed);
    $('p-drop').classList.toggle('hidden', ed);
    ['p-cur-card', 'p-cur-round'].forEach((id) => $(id).classList.toggle('hidden', ed));
    ['p-new-card', 'p-new-round'].forEach((id) => $(id).classList.toggle('hidden', !ed));
    $('p-source').classList.toggle('hidden', ed);
    $('p-reset').classList.toggle('hidden', ed || !picState.custom);
    $('p-prev-title').textContent = ed ? 'Preview' : 'Currently live';
  }

  // Shows which picture visitors see right now. Returns the files found, or null if the check failed.
  async function loadProfile() {
    let files = null;
    try { files = await listProfileFiles(); }
    catch (err) { sayPic('Could not check your current picture: ' + (err.message || 'unknown error')); }
    const note = $('p-source').firstElementChild;
    if (files === null) {
      picState.custom = false;
      note.textContent = 'Your current picture could not be checked.';
    } else {
      picState.custom = files.length > 0;
      const url = files.length ? pictureUrl(files[0].name) : DEFAULT_PICTURE;
      $('p-cur-card').src = url; $('p-cur-round').src = url;
      note.textContent = files.length ? 'This is the picture you uploaded.' : 'You have not uploaded a picture, so the site shows your GitHub picture.';
    }
    syncPicUi();
    return files;
  }

  /* The editor keeps a square crop: (cx, cy) is the point of the photo at the centre of the frame,
     zoom >= 1 shrinks the visible square. The ID card shows the middle 80% of that square (4:5),
     the About section shows all of it, so the previews below are drawn exactly that way. */
  const picVis = () => Math.min(pic.img.naturalWidth, pic.img.naturalHeight) / pic.zoom;
  function clampPic() {
    const v = picVis(), w = pic.img.naturalWidth, h = pic.img.naturalHeight;
    pic.cx = Math.min(Math.max(pic.cx, v / 2), w - v / 2);
    pic.cy = Math.min(Math.max(pic.cy, v / 2), h - v / 2);
  }
  function drawSquare(ctx, size) {
    const v = picVis();
    ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(pic.img, pic.cx - v / 2, pic.cy - v / 2, v, v, 0, 0, size, size);
  }
  function renderPic() {
    if (!pic.img) return;
    clampPic();
    drawSquare(cctx, cv.width);
    const rc = newRound.getContext('2d'), kc = newCard.getContext('2d');
    rc.imageSmoothingQuality = 'high'; kc.imageSmoothingQuality = 'high';
    rc.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, newRound.width, newRound.height);
    kc.drawImage(cv, cv.width * 0.1, 0, cv.width * 0.8, cv.height, 0, 0, newCard.width, newCard.height);
  }
  function closePicEditor() {
    if (pic.url) URL.revokeObjectURL(pic.url);
    pic.img = null; pic.url = null; pic.drag = null;
    $('p-file').value = '';
    picState.editing = false; syncPicUi();
  }
  function openPicFile(file) {
    sayPic('');
    if (!file) return;
    if (!/^image\//.test(file.type)) { sayPic('Choose an image file (JPG, PNG or WEBP).'); return; }
    if (file.size > PIC_MAX_INPUT) { sayPic('That file is larger than 25 MB. Choose a smaller photo.'); return; }
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) { URL.revokeObjectURL(url); sayPic('This image has no usable size. Try a JPG, PNG or WEBP photo.'); return; }
      if (pic.url) URL.revokeObjectURL(pic.url);
      pic.img = img; pic.url = url; pic.zoom = 1; pic.drag = null;
      pic.cx = img.naturalWidth / 2; pic.cy = img.naturalHeight / 2;
      $('p-zoom').value = '1';
      picState.editing = true; syncPicUi(); renderPic();
    };
    img.onerror = () => { URL.revokeObjectURL(url); sayPic('This file could not be read as an image. Try a JPG, PNG or WEBP photo.'); };
    img.src = url;
  }
  // Final image: a square, at most 900 px, saved as WEBP (JPEG where the browser cannot encode WEBP).
  function exportPic() {
    const size = Math.max(256, Math.min(900, Math.round(picVis())));
    const out = document.createElement('canvas'); out.width = size; out.height = size;
    drawSquare(out.getContext('2d'), size);
    return new Promise((resolve, reject) => {
      out.toBlob((webp) => {
        if (webp && webp.type === 'image/webp') { resolve(webp); return; }
        out.toBlob((jpg) => (jpg ? resolve(jpg) : reject(new Error('Could not prepare the image.'))), 'image/jpeg', 0.9);
      }, 'image/webp', 0.9);
    });
  }

  $('p-file').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; openPicFile(f); });
  const drop = $('p-drop');
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => openPicFile(e.dataTransfer && e.dataTransfer.files[0]));

  $('p-zoom').addEventListener('input', (e) => { pic.zoom = Math.min(4, Math.max(1, Number(e.target.value) || 1)); renderPic(); });
  cv.addEventListener('pointerdown', (e) => {
    if (!pic.img) return;
    pic.drag = { x: e.clientX, y: e.clientY, cx: pic.cx, cy: pic.cy };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!pic.drag || !pic.img) return;
    const k = picVis() / cv.getBoundingClientRect().width;
    pic.cx = pic.drag.cx - (e.clientX - pic.drag.x) * k;
    pic.cy = pic.drag.cy - (e.clientY - pic.drag.y) * k;
    renderPic();
  });
  const endDrag = (e) => { pic.drag = null; try { cv.releasePointerCapture(e.pointerId); } catch (x) {} };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('keydown', (e) => {
    if (!pic.img) return;
    const s = picVis() * 0.03;
    // The photo moves the way the arrow points, like dragging it.
    const d = { ArrowLeft: [s, 0], ArrowRight: [-s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[e.key];
    if (!d) return;
    e.preventDefault(); pic.cx += d[0]; pic.cy += d[1]; renderPic();
  });

  $('p-cancel').addEventListener('click', () => { closePicEditor(); sayPic(''); });
  $('p-save').addEventListener('click', async () => {
    if (!pic.img) return;
    const save = $('p-save'), cancel = $('p-cancel');
    save.disabled = true; cancel.disabled = true;
    try {
      sayPic('Preparing the picture…');
      const blob = await exportPic();
      const name = Date.now() + '-' + crypto.randomUUID().slice(0, 8) + '.' + (blob.type === 'image/webp' ? 'webp' : 'jpg');
      sayPic('Uploading…');
      const up = await db.storage.from(BUCKET).upload(PROFILE_DIR + '/' + name, blob, { upsert: false, contentType: blob.type, cacheControl: '31536000' });
      if (up.error) throw up.error;
      // The new picture is live now. Remove older ones so storage does not pile up.
      let note = '';
      try {
        const old = (await listProfileFiles()).filter((f) => f.name !== name).map((f) => PROFILE_DIR + '/' + f.name);
        if (old.length) {
          const r = await db.storage.from(BUCKET).remove(old); if (r.error) throw r.error;
          // A blocked delete can come back without an error, so check what is really left.
          if ((await listProfileFiles()).some((f) => f.name !== name)) throw new Error('Old picture still in storage.');
        }
      } catch (cleanupErr) { note = ' The previous picture could not be removed from storage.'; }
      closePicEditor();
      await loadProfile();
      sayPic('Profile picture saved. Refresh your portfolio to see it.' + note, true);
    } catch (err) {
      sayPic(err.message || 'Upload failed. Try again.');
    } finally { save.disabled = false; cancel.disabled = false; }
  });
  $('p-reset').addEventListener('click', async () => {
    if (!confirm('Remove your uploaded picture and show your GitHub picture instead?')) return;
    const btn = $('p-reset'); btn.disabled = true;
    try {
      const files = await listProfileFiles();
      if (files.length) {
        const { error } = await db.storage.from(BUCKET).remove(files.map((f) => PROFILE_DIR + '/' + f.name));
        if (error) throw error;
      }
      const left = await loadProfile();
      if (left && left.length) throw new Error('The picture could not be removed. Check that the storage delete policy from supabase_setup.sql is in place.');
      sayPic('The site now shows your GitHub picture.', true);
    } catch (err) { sayPic(err.message || 'Could not remove the picture.'); }
    finally { btn.disabled = false; }
  });

  async function loadAll() { await Promise.all([loadCerts(), loadLinks(), loadContent(), loadMetrics(), loadProfile()]); }
  db.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') setTimeout(refreshSession, 0); });
  refreshSession();
})();
