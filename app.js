/* ════════════════════════════════════════════════════════════
   app.js — Main Application Logic
   Handles: portfolio render, admin panel, about section,
            image upload, localStorage persistence, UI state
   Depends on: auth.js (must be loaded first)
   ════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   STORAGE KEYS
══════════════════════════════════════════════════════════ */
const KEYS = {
  WORKS:       'am_works',
  CONTACT:     'am_contact',
  ABOUT:       'am_about',    // { bio, photoData }
  PROFILE_IMG: 'am_profile_img',
};

/* ══════════════════════════════════════════════════════════
   APP STATE
══════════════════════════════════════════════════════════ */
let works          = [];
let contactInfo    = {};
let aboutData      = {};
let currentFilter  = 'all';
let editingId      = null;
let uploadedImgData = null;   // base64 of current upload in form
let toastTimer     = null;

/* ══════════════════════════════════════════════════════════
   DEFAULT DATA
══════════════════════════════════════════════════════════ */
const DEFAULT_CONTACT = {
  wa: '6281234567890',
  li: 'https://linkedin.com/in/adzinmahendra',
  em: 'adzin.mahendra@email.com',
};

const DEFAULT_ABOUT = {
  bio: 'Saya seorang Graphic & UI/UX Designer yang passionate dalam menciptakan desain yang tidak hanya indah secara visual, tetapi juga fungsional dan berdampak.\n\nDengan pengalaman di berbagai industri, saya memahami bahwa desain yang baik adalah jembatan antara bisnis dan penggunanya.',
  photoData: '',
};

const SAMPLE_WORKS = [
  { id:'s1', title:'Redesign App E-Commerce',      category:'ui-ux',         desc:'Perancangan ulang antarmuka aplikasi belanja online dengan fokus pada peningkatan pengalaman pengguna dan konversi penjualan.',     tags:['Figma','Mobile App','iOS'],             year:'2024', img:'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80' },
  { id:'s2', title:'Brand Identity — Kopi Nusantara', category:'branding',   desc:'Perancangan identitas merek lengkap untuk kedai kopi lokal, meliputi logo, warna, tipografi, dan panduan merek.',               tags:['Illustrator','Brand Guidelines','Logo'], year:'2024', img:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80' },
  { id:'s3', title:'Dashboard Analytics Platform', category:'ui-ux',         desc:'Desain dashboard analitik data untuk platform SaaS dengan visualisasi data yang intuitif dan bersih.',                           tags:['Figma','Web App','Data Viz'],            year:'2023', img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' },
  { id:'s4', title:'Poster Event Musik — Nocturnal', category:'graphic',     desc:'Desain poster untuk festival musik elektronik dengan gaya visual yang gelap, dramatis, dan futuristik.',                         tags:['Photoshop','Poster','Event'],            year:'2023', img:'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80' },
  { id:'s5', title:'Ilustrasi Karakter — Batik Series', category:'illustration', desc:'Seri ilustrasi karakter digital dengan motif batik modern, menggabungkan budaya lokal dengan estetika kontemporer.',       tags:['Procreate','Character Design','Batik'],  year:'2023', img:'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80' },
  { id:'s6', title:'Website Landing Page — FinTech', category:'ui-ux',       desc:'Perancangan halaman utama produk finansial dengan pendekatan clean dan modern untuk meningkatkan kepercayaan pengguna.',         tags:['Figma','Landing Page','FinTech'],        year:'2024', img:'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80' },
];

/* ══════════════════════════════════════════════════════════
   STORAGE UTILITIES
══════════════════════════════════════════════════════════ */

function loadFromStorage() {
  // Works
  try {
    const raw = localStorage.getItem(KEYS.WORKS);
    works = raw ? JSON.parse(raw) : null;
    if (!works || works.length === 0) {
      works = SAMPLE_WORKS;
      saveWorks();
    }
  } catch { works = SAMPLE_WORKS; saveWorks(); }

  // Contact
  try {
    const raw = localStorage.getItem(KEYS.CONTACT);
    contactInfo = raw ? JSON.parse(raw) : { ...DEFAULT_CONTACT };
  } catch { contactInfo = { ...DEFAULT_CONTACT }; }

  // About
  try {
    const raw = localStorage.getItem(KEYS.ABOUT);
    aboutData = raw ? JSON.parse(raw) : { ...DEFAULT_ABOUT };
    if (!aboutData.bio)       aboutData.bio = DEFAULT_ABOUT.bio;
    if (!aboutData.photoData) aboutData.photoData = '';
  } catch { aboutData = { ...DEFAULT_ABOUT }; }
}

function saveWorks()   { localStorage.setItem(KEYS.WORKS,   JSON.stringify(works)); }
function saveContact() { localStorage.setItem(KEYS.CONTACT, JSON.stringify(contactInfo)); }
function saveAbout()   { localStorage.setItem(KEYS.ABOUT,   JSON.stringify(aboutData)); }

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();

  // Restore admin session (survives page refresh within same tab)
  const wasLoggedIn = Auth.restoreSession();
  if (wasLoggedIn) applyAdminMode(true);

  document.getElementById('year').textContent = new Date().getFullYear();

  renderPortfolio();
  updateStats();
  applyContactLinks();
  renderAbout();
  fillSettingsForms();
});

/* ══════════════════════════════════════════════════════════
   ADMIN MODE TOGGLE
══════════════════════════════════════════════════════════ */
function applyAdminMode(active) {
  const body = document.body;
  if (active) {
    body.classList.add('admin-mode');
    document.getElementById('admin-badge').style.display = 'inline';
    document.getElementById('admin-btn').textContent = 'Panel';
  } else {
    body.classList.remove('admin-mode');
    document.getElementById('admin-badge').style.display = 'none';
    document.getElementById('admin-btn').textContent = 'Admin';
  }
}

/* ══════════════════════════════════════════════════════════
   HERO STATS
══════════════════════════════════════════════════════════ */
function updateStats() {
  const el = document.getElementById('stat-projects');
  if (!el) return;
  animateCount(el, works.length);
}

function animateCount(el, target) {
  let n = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const t = setInterval(() => {
    n = Math.min(n + step, target);
    el.textContent = n + '+';
    if (n >= target) { el.textContent = target + '+'; clearInterval(t); }
  }, 40);
}

/* ══════════════════════════════════════════════════════════
   PORTFOLIO RENDERING
══════════════════════════════════════════════════════════ */
const CATEGORY_LABELS = {
  'ui-ux':        'UI/UX Design',
  'branding':     'Branding',
  'graphic':      'Graphic Design',
  'illustration': 'Illustration',
};
function catLabel(cat) { return CATEGORY_LABELS[cat] || cat; }

function filterWorks(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPortfolio();
}

function renderPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  const list = currentFilter === 'all' ? works : works.filter(w => w.category === currentFilter);

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🎨</div>
        <p>Belum ada karya${currentFilter !== 'all' ? ' di kategori ini' : ''}.
           ${Auth.isLoggedIn() ? ' Tambahkan karya dari Panel Admin!' : ''}</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((w, i) => `
    <div class="portfolio-card" onclick="openLightbox('${w.id}')" style="animation-delay:${i * 55}ms">
      <div class="card-img-wrap">
        ${imgOrPlaceholder(w.img, 'card-img', '16/10')}
        <div class="card-overlay">
          <div class="card-view-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Lihat Detail
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-category">${catLabel(w.category)}</div>
        <div class="card-title">${escapeHTML(w.title)}</div>
        <div class="card-desc">${escapeHTML(w.desc || 'Tidak ada deskripsi.')}</div>
        <div class="card-footer">
          <div class="card-tags">
            ${(w.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}
          </div>
          ${w.year ? `<span style="font-size:12px;color:var(--text2)">${w.year}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════ */
function openLightbox(id) {
  const w = works.find(x => x.id === id);
  if (!w) return;

  document.getElementById('lb-category').textContent = catLabel(w.category);
  document.getElementById('lb-title').textContent    = w.title;
  document.getElementById('lb-desc').textContent     = w.desc || 'Tidak ada deskripsi.';
  document.getElementById('lb-tags').innerHTML = (w.tags || [])
    .map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

  const wrap = document.getElementById('lb-img-wrap');
  if (w.img) {
    wrap.innerHTML = `<img src="${w.img}"
      style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px 16px 0 0;display:block"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-placeholder',style:'aspect-ratio:16/9;border-radius:16px 16px 0 0',textContent:'🖼️'}))" />`;
  } else {
    wrap.innerHTML = `<div class="img-placeholder" style="aspect-ratio:16/9;border-radius:16px 16px 0 0">🖼️</div>`;
  }

  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  if (e.target === document.getElementById('lightbox')) closeLightboxDirect();
}
function closeLightboxDirect() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════════
   ABOUT SECTION
══════════════════════════════════════════════════════════ */
function renderAbout() {
  // Bio text
  const bioEl = document.getElementById('about-bio-display');
  if (bioEl) {
    // Split by newline into paragraphs
    bioEl.innerHTML = (aboutData.bio || DEFAULT_ABOUT.bio)
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${escapeHTML(p.trim())}</p>`)
      .join('');
  }

  // Profile photo
  const photoEl = document.getElementById('about-profile-img');
  const placeholder = document.getElementById('about-placeholder');
  if (aboutData.photoData) {
    if (photoEl)     { photoEl.src = aboutData.photoData; photoEl.style.display = 'block'; }
    if (placeholder) { placeholder.style.display = 'none'; }
  } else {
    if (photoEl)     { photoEl.style.display = 'none'; }
    if (placeholder) { placeholder.style.display = 'flex'; }
  }
}

/* Profile photo upload */
function handleProfilePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('⚠️ File harus berupa gambar!', 'error'); return; }
  if (file.size > 10 * 1024 * 1024)   { toast('⚠️ Ukuran file maks 10MB!', 'error'); return; }
  if (!Auth.isLoggedIn()) return;

  const reader = new FileReader();
  reader.onload = ev => {
    aboutData.photoData = ev.target.result;
    saveAbout();
    renderAbout();
    toast('✅ Foto profil diperbarui!', 'success');
  };
  reader.readAsDataURL(file);
}

function triggerProfileUpload() {
  if (!Auth.isLoggedIn()) return;
  document.getElementById('profile-file-input').click();
}

/* About bio inline edit */
function startBioEdit() {
  if (!Auth.isLoggedIn()) return;
  const display  = document.getElementById('about-bio-display');
  const textarea = document.getElementById('bio-textarea');
  const btnGroup = document.getElementById('bio-edit-btns');
  textarea.value = aboutData.bio || DEFAULT_ABOUT.bio;
  display.style.display   = 'none';
  textarea.style.display  = 'block';
  if (btnGroup) btnGroup.style.display = 'flex';
  textarea.focus();
}

function saveBioEdit() {
  const textarea = document.getElementById('bio-textarea');
  const display  = document.getElementById('about-bio-display');
  const btnGroup = document.getElementById('bio-edit-btns');
  aboutData.bio = textarea.value;
  saveAbout();
  display.style.display   = 'block';
  textarea.style.display  = 'none';
  if (btnGroup) btnGroup.style.display = 'none';
  renderAbout();
  toast('✅ Bio diperbarui!', 'success');
}

function cancelBioEdit() {
  const textarea = document.getElementById('bio-textarea');
  const display  = document.getElementById('about-bio-display');
  const btnGroup = document.getElementById('bio-edit-btns');
  display.style.display   = 'block';
  textarea.style.display  = 'none';
  if (btnGroup) btnGroup.style.display = 'none';
}

/* ══════════════════════════════════════════════════════════
   CONTACT LINKS
══════════════════════════════════════════════════════════ */
function applyContactLinks() {
  const wa = document.getElementById('wa-link');
  const li = document.getElementById('li-link');
  const em = document.getElementById('em-link');
  if (wa) wa.href = `https://wa.me/${contactInfo.wa}`;
  if (li) li.href = contactInfo.li;
  if (em) em.href = `mailto:${contactInfo.em}`;
}

/* ══════════════════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════════════════ */
function openAdmin() {
  document.getElementById('admin-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  Auth.isLoggedIn() ? showAdminDashboard() : showLoginScreen();
}

function closeAdmin() {
  document.getElementById('admin-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeAdminOutside(e) {
  if (e.target === document.getElementById('admin-overlay')) closeAdmin();
}

function showLoginScreen() {
  document.getElementById('login-state').style.display = 'flex';
  document.getElementById('admin-state').style.display = 'none';
  document.getElementById('login-error').classList.remove('visible');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

function showAdminDashboard() {
  document.getElementById('login-state').style.display = 'none';
  document.getElementById('admin-state').style.display = 'block';
  renderWorkList();
}

/* ── Login / Logout ──────────────────────────────────────── */
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const result = Auth.login(u, p);

  if (result.success) {
    applyAdminMode(true);
    showAdminDashboard();
    toast('✅ ' + result.message, 'success');
  } else {
    document.getElementById('login-error').classList.add('visible');
  }
}

function doLogout() {
  Auth.logout();
  applyAdminMode(false);
  closeAdmin();
  toast('Logout berhasil.', '');
}

/* ── Tab switching ───────────────────────────────────────── */
function switchTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const section = document.getElementById('tab-' + tab);
  if (section) section.classList.add('active');
  if (tab === 'manage')   renderWorkList();
  if (tab === 'settings') fillSettingsForms();
}

/* ══════════════════════════════════════════════════════════
   WORK CRUD
══════════════════════════════════════════════════════════ */

/* File upload handlers */
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) readWorkFile(file);
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.add('dragover');
}
function handleDragLeave() {
  document.getElementById('upload-area').classList.remove('dragover');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) readWorkFile(file);
}

function readWorkFile(file) {
  if (file.size > 10 * 1024 * 1024) { toast('⚠️ File maks 10MB!', 'error'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedImgData = ev.target.result;
    const prev = document.getElementById('upload-preview');
    prev.src = uploadedImgData;
    prev.style.display = 'block';
    document.getElementById('upload-text').style.display = 'none';
    document.getElementById('f-img').value = '';
  };
  reader.readAsDataURL(file);
}

function previewFromUrl(url) {
  if (!url) return;
  uploadedImgData = null;
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('upload-text').style.display = 'block';
}

/* Submit (add or update) */
function submitWork() {
  const title    = document.getElementById('f-title').value.trim();
  const category = document.getElementById('f-category').value;
  const desc     = document.getElementById('f-desc').value.trim();
  const tags     = document.getElementById('f-tags').value.trim()
                     .split(',').map(t => t.trim()).filter(Boolean);
  const year     = document.getElementById('f-year').value.trim();
  const imgUrl   = document.getElementById('f-img').value.trim();
  const img      = uploadedImgData || imgUrl || '';

  if (!title || !category) {
    toast('⚠️ Judul dan kategori wajib diisi!', 'error'); return;
  }

  if (editingId) {
    const idx = works.findIndex(w => w.id === editingId);
    if (idx !== -1) {
      works[idx] = { ...works[idx], title, category, desc, tags, year,
                     img: img || works[idx].img, updatedAt: Date.now() };
    }
    toast('✅ Karya berhasil diperbarui!', 'success');
    cancelEdit();
  } else {
    works.unshift({ id: 'w' + Date.now(), title, category, desc, tags, year, img, createdAt: Date.now() });
    toast('✅ Karya berhasil ditambahkan!', 'success');
  }

  saveWorks();
  resetWorkForm();
  renderPortfolio();
  updateStats();
  renderWorkList();
}

function editWork(id) {
  const w = works.find(x => x.id === id);
  if (!w) return;
  editingId = id;

  document.getElementById('f-title').value    = w.title;
  document.getElementById('f-category').value = w.category;
  document.getElementById('f-desc').value     = w.desc  || '';
  document.getElementById('f-tags').value     = (w.tags || []).join(', ');
  document.getElementById('f-year').value     = w.year  || '';
  document.getElementById('f-img').value      = '';
  document.getElementById('submit-btn').textContent = 'Perbarui Karya';
  document.getElementById('edit-mode-banner').classList.add('visible');
  uploadedImgData = null;

  if (w.img) {
    const prev = document.getElementById('upload-preview');
    prev.src = w.img; prev.style.display = 'block';
    document.getElementById('upload-text').style.display = 'none';
  }

  // Switch to Add tab
  const tabs = document.querySelectorAll('.admin-tab');
  switchTab('add', tabs[0]);
  // Scroll panel to top
  document.getElementById('admin-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  editingId = null;
  document.getElementById('submit-btn').textContent = 'Simpan Karya';
  document.getElementById('edit-mode-banner').classList.remove('visible');
  resetWorkForm();
}

function deleteWork(id) {
  if (!confirm('Yakin ingin menghapus karya ini?')) return;
  works = works.filter(w => w.id !== id);
  saveWorks();
  renderPortfolio();
  updateStats();
  renderWorkList();
  toast('🗑️ Karya dihapus.', '');
}

function clearAllWorks() {
  if (!confirm('Hapus SEMUA karya? Tindakan ini tidak bisa dibatalkan!')) return;
  works = [];
  saveWorks();
  renderPortfolio();
  updateStats();
  renderWorkList();
  toast('🗑️ Semua karya dihapus.', '');
}

function resetWorkForm() {
  ['f-title','f-category','f-desc','f-tags','f-year','f-img']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  uploadedImgData = null;
  const prev = document.getElementById('upload-preview');
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  const uploadText = document.getElementById('upload-text');
  if (uploadText) uploadText.style.display = 'block';
  const fi = document.getElementById('file-input');
  if (fi) fi.value = '';
}

function renderWorkList() {
  const list  = document.getElementById('work-list');
  const count = document.getElementById('manage-count');
  if (count) count.textContent = works.length;

  if (!list) return;
  if (works.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><p>Belum ada karya.</p></div>`;
    return;
  }

  list.innerHTML = works.map(w => `
    <div class="work-item">
      ${w.img
        ? `<img src="${w.img}" class="work-thumb"
             onerror="this.style.background='var(--border)';this.src=''" />`
        : `<div class="work-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.4rem">🖼️</div>`}
      <div class="work-info">
        <strong>${escapeHTML(w.title)}</strong>
        <span>${catLabel(w.category)}</span>
      </div>
      <div class="work-actions">
        <button class="icon-btn" onclick="editWork('${w.id}')" title="Edit">✏️</button>
        <button class="icon-btn delete" onclick="deleteWork('${w.id}')" title="Hapus">🗑️</button>
      </div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════════════ */
function fillSettingsForms() {
  const su = document.getElementById('s-user');
  const sw = document.getElementById('s-wa');
  const sl = document.getElementById('s-li');
  const se = document.getElementById('s-em');
  if (su) su.value = Auth.getUsername();
  if (sw) sw.value = contactInfo.wa;
  if (sl) sl.value = contactInfo.li;
  if (se) se.value = contactInfo.em;
}

function saveCredentialSettings() {
  const u  = document.getElementById('s-user').value;
  const p  = document.getElementById('s-pass').value;
  const p2 = document.getElementById('s-pass2').value;
  const result = Auth.updateCredentials(u, p, p2);
  if (result.success) {
    document.getElementById('s-pass').value  = '';
    document.getElementById('s-pass2').value = '';
    toast('✅ ' + result.message, 'success');
  } else {
    toast('⚠️ ' + result.message, 'error');
  }
}

function saveContactSettings() {
  contactInfo.wa = document.getElementById('s-wa').value.trim();
  contactInfo.li = document.getElementById('s-li').value.trim();
  contactInfo.em = document.getElementById('s-em').value.trim();
  saveContact();
  applyContactLinks();
  toast('✅ Info kontak disimpan!', 'success');
}

function resetAllData() {
  if (!confirm('Reset SEMUA data termasuk karya, foto, dan pengaturan?\nTindakan ini tidak bisa dibatalkan!')) return;
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}

/* ══════════════════════════════════════════════════════════
   SCROLL HELPER
══════════════════════════════════════════════════════════ */
function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.innerHTML = `<span>${msg}</span>`;
  el.className = 'show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3200);
}

/* ══════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════ */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function imgOrPlaceholder(src, cls, ratio) {
  if (src) {
    return `<img src="${src}" class="${cls}"
      style="aspect-ratio:${ratio};object-fit:cover;width:100%;display:block"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
      <div class="img-placeholder" style="aspect-ratio:${ratio};display:none">🖼️</div>`;
  }
  return `<div class="img-placeholder" style="aspect-ratio:${ratio}">🖼️</div>`;
}

// Allow Enter key on login password field
document.addEventListener('DOMContentLoaded', () => {
  const passEl = document.getElementById('login-pass');
  if (passEl) passEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});
