/* ════════════════════════════════════════════════════════════
   app.js — Main Application Logic
   Depends on: auth.js (loaded first via index.html)
   ════════════════════════════════════════════════════════════ */

/* ── Storage Keys ────────────────────────────────────────── */
var KEYS = { WORKS: 'am_works', CONTACT: 'am_contact', ABOUT: 'am_about' };

/* ── App State ───────────────────────────────────────────── */
var works = [], contactInfo = {}, aboutData = {};
var currentFilter = 'all', editingId = null;
var uploadedImgData = null, toastTimer = null;

/* ── Defaults ────────────────────────────────────────────── */
var DEFAULT_CONTACT = { wa: '6281234567890', li: 'https://linkedin.com/in/adzinmahendra', em: 'adzin.mahendra@email.com' };
var DEFAULT_ABOUT   = { bio: 'Saya seorang Graphic & UI/UX Designer yang passionate dalam menciptakan desain yang tidak hanya indah secara visual, tetapi juga fungsional dan berdampak.\n\nDengan pengalaman di berbagai industri, saya memahami bahwa desain yang baik adalah jembatan antara bisnis dan penggunanya.', photoData: '' };
var SAMPLE_WORKS = [
  { id:'s1', title:'Redesign App E-Commerce',         category:'ui-ux',        desc:'Perancangan ulang antarmuka aplikasi belanja online dengan fokus pada peningkatan pengalaman pengguna dan konversi penjualan.',   tags:['Figma','Mobile App','iOS'],             year:'2024', img:'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80' },
  { id:'s2', title:'Brand Identity — Kopi Nusantara', category:'branding',     desc:'Perancangan identitas merek lengkap untuk kedai kopi lokal, meliputi logo, warna, tipografi, dan panduan merek.',             tags:['Illustrator','Brand Guidelines','Logo'], year:'2024', img:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80' },
  { id:'s3', title:'Dashboard Analytics Platform',    category:'ui-ux',        desc:'Desain dashboard analitik data untuk platform SaaS dengan visualisasi data yang intuitif dan bersih.',                         tags:['Figma','Web App','Data Viz'],            year:'2023', img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' },
  { id:'s4', title:'Poster Event Musik — Nocturnal',  category:'graphic',      desc:'Desain poster untuk festival musik elektronik dengan gaya visual yang gelap, dramatis, dan futuristik.',                       tags:['Photoshop','Poster','Event'],            year:'2023', img:'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80' },
  { id:'s5', title:'Ilustrasi Karakter — Batik',      category:'illustration', desc:'Seri ilustrasi karakter digital dengan motif batik modern, menggabungkan budaya lokal dengan estetika kontemporer.',           tags:['Procreate','Character Design','Batik'],  year:'2023', img:'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80' },
  { id:'s6', title:'Landing Page — FinTech',          category:'ui-ux',        desc:'Perancangan halaman utama produk finansial dengan pendekatan clean dan modern untuk meningkatkan kepercayaan pengguna.',         tags:['Figma','Landing Page','FinTech'],        year:'2024', img:'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80' },
];

/* ════════════ STORAGE ════════════ */
function loadFromStorage() {
  try { var r = localStorage.getItem(KEYS.WORKS); works = r ? JSON.parse(r) : []; if (!works.length) { works = SAMPLE_WORKS.slice(); saveWorks(); } } catch(e) { works = SAMPLE_WORKS.slice(); saveWorks(); }
  try { var r = localStorage.getItem(KEYS.CONTACT); contactInfo = r ? JSON.parse(r) : Object.assign({}, DEFAULT_CONTACT); } catch(e) { contactInfo = Object.assign({}, DEFAULT_CONTACT); }
  try { var r = localStorage.getItem(KEYS.ABOUT); aboutData = r ? JSON.parse(r) : Object.assign({}, DEFAULT_ABOUT); if (!aboutData.bio) aboutData.bio = DEFAULT_ABOUT.bio; if (!aboutData.photoData) aboutData.photoData = ''; } catch(e) { aboutData = Object.assign({}, DEFAULT_ABOUT); }
}
function saveWorks()   { localStorage.setItem(KEYS.WORKS,   JSON.stringify(works)); }
function saveContact() { localStorage.setItem(KEYS.CONTACT, JSON.stringify(contactInfo)); }
function saveAbout()   { localStorage.setItem(KEYS.ABOUT,   JSON.stringify(aboutData)); }

/* ════════════ INIT ════════════ */
document.addEventListener('DOMContentLoaded', function() {
  loadFromStorage();
  if (Auth.restoreSession()) applyAdminMode(true);
  document.getElementById('year').textContent = new Date().getFullYear();
  renderPortfolio();
  updateStats();
  applyContactLinks();
  renderAbout();
  fillSettingsForms();
  // Enter key on login
  var passEl = document.getElementById('login-pass');
  if (passEl) passEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
});

/* ════════════ ADMIN MODE ════════════ */
function applyAdminMode(active) {
  if (active) {
    document.body.classList.add('admin-mode');
    document.getElementById('admin-badge').style.display = 'inline';
    document.getElementById('admin-btn').textContent = 'Panel';
  } else {
    document.body.classList.remove('admin-mode');
    document.getElementById('admin-badge').style.display = 'none';
    document.getElementById('admin-btn').textContent = 'Admin';
  }
}

/* ════════════ STATS ════════════ */
function updateStats() {
  var el = document.getElementById('stat-projects');
  if (!el) return;
  var target = works.length, n = 0;
  var t = setInterval(function() { n = Math.min(n + Math.max(1, Math.ceil(target/30)), target); el.textContent = n+'+'; if (n >= target) clearInterval(t); }, 40);
}

/* ════════════ PORTFOLIO ════════════ */
var CAT = { 'ui-ux':'UI/UX Design', 'branding':'Branding', 'graphic':'Graphic Design', 'illustration':'Illustration' };
function catLabel(c) { return CAT[c] || c; }

function filterWorks(cat, btn) {
  currentFilter = cat;
  var btns = document.querySelectorAll('.filter-btn');
  for (var i=0;i<btns.length;i++) btns[i].classList.remove('active');
  if (btn) btn.classList.add('active');
  renderPortfolio();
}

function renderPortfolio() {
  var grid = document.getElementById('portfolio-grid');
  if (!grid) return;
  var list = currentFilter === 'all' ? works : works.filter(function(w){ return w.category === currentFilter; });
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎨</div><p>Belum ada karya' + (currentFilter!=='all'?' di kategori ini':'') + '.</p></div>';
    return;
  }
  var html = '';
  for (var i=0;i<list.length;i++) {
    var w=list[i];
    html += '<div class="portfolio-card" onclick="openLightbox(\''+w.id+'\')" style="animation-delay:'+(i*55)+'ms">';
    html += '<div class="card-img-wrap">';
    html += w.img ? '<img src="'+w.img+'" class="card-img" alt="'+esc(w.title)+'" onerror="this.style.display=\'none\'" />' : '<div class="img-placeholder">🖼️</div>';
    html += '<div class="card-overlay"><div class="card-view-btn">👁 Lihat Detail</div></div></div>';
    html += '<div class="card-body"><div class="card-category">'+catLabel(w.category)+'</div>';
    html += '<div class="card-title">'+esc(w.title)+'</div>';
    html += '<div class="card-desc">'+esc(w.desc||'Tidak ada deskripsi.')+'</div>';
    html += '<div class="card-footer"><div class="card-tags">';
    var tags=w.tags||[]; for (var t=0;t<Math.min(tags.length,3);t++) html += '<span class="tag">'+esc(tags[t])+'</span>';
    html += '</div>'+(w.year?'<span style="font-size:12px;color:var(--text2)">'+w.year+'</span>':'')+'</div></div></div>';
  }
  grid.innerHTML = html;
}

/* ════════════ LIGHTBOX ════════════ */
function openLightbox(id) {
  var w=null; for(var i=0;i<works.length;i++){if(works[i].id===id){w=works[i];break;}} if(!w) return;
  document.getElementById('lb-category').textContent = catLabel(w.category);
  document.getElementById('lb-title').textContent    = w.title;
  document.getElementById('lb-desc').textContent     = w.desc||'Tidak ada deskripsi.';
  var th=''; var tags=w.tags||[]; for(var i=0;i<tags.length;i++) th+='<span class="tag">'+esc(tags[i])+'</span>';
  document.getElementById('lb-tags').innerHTML = th;
  var wrap=document.getElementById('lb-img-wrap');
  wrap.innerHTML = w.img ? '<img src="'+w.img+'" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px 16px 0 0;display:block" onerror="this.style.display=\'none\'" />'
                         : '<div class="img-placeholder" style="aspect-ratio:16/9;border-radius:16px 16px 0 0">🖼️</div>';
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(e) { if (e.target===document.getElementById('lightbox')) closeLightboxDirect(); }
function closeLightboxDirect() { document.getElementById('lightbox').classList.remove('open'); document.body.style.overflow=''; }

/* ════════════ ABOUT — PUBLIC ════════════ */
function renderAbout() {
  var bioEl = document.getElementById('about-bio-display');
  if (bioEl) {
    var parts = (aboutData.bio||DEFAULT_ABOUT.bio).split('\n\n'), html='';
    for (var i=0;i<parts.length;i++) if(parts[i].trim()) html+='<p>'+esc(parts[i].trim())+'</p>';
    bioEl.innerHTML = html;
  }
  var photoEl=document.getElementById('about-profile-img'), placeholder=document.getElementById('about-placeholder');
  if (aboutData.photoData) {
    if(photoEl){photoEl.src=aboutData.photoData;photoEl.style.display='block';}
    if(placeholder) placeholder.style.display='none';
  } else {
    if(photoEl) photoEl.style.display='none';
    if(placeholder) placeholder.style.display='flex';
  }
  // sync admin preview
  var ap=document.getElementById('admin-profile-preview');
  if(ap){if(aboutData.photoData){ap.src=aboutData.photoData;ap.style.display='block';}else ap.style.display='none';}
}

/* ════════════ ABOUT — ADMIN TAB ════════════ */
function renderAboutAdminTab() {
  var ap=document.getElementById('admin-profile-preview');
  if(ap){if(aboutData.photoData){ap.src=aboutData.photoData;ap.style.display='block';}else ap.style.display='none';}
  var bi=document.getElementById('admin-bio-input');
  if(bi) bi.value = aboutData.bio||DEFAULT_ABOUT.bio;
}

function handleAdminProfilePhoto(e) {
  var file=e.target.files[0]; if(!file) return;
  if(!file.type.startsWith('image/')){ toast('⚠️ File harus berupa gambar!','error'); return; }
  if(file.size>10*1024*1024){ toast('⚠️ Ukuran file maks 10MB!','error'); return; }
  var reader=new FileReader();
  reader.onload=function(ev){
    aboutData.photoData=ev.target.result; saveAbout(); renderAbout();
    toast('✅ Foto profil diperbarui!','success');
  };
  reader.readAsDataURL(file);
}

function removeProfilePhoto() {
  if(!confirm('Hapus foto profil?')) return;
  aboutData.photoData=''; saveAbout(); renderAbout();
  var ap=document.getElementById('admin-profile-preview'); if(ap) ap.style.display='none';
  toast('🗑️ Foto profil dihapus.','');
}

function saveAdminBio() {
  var bi=document.getElementById('admin-bio-input'); if(!bi) return;
  aboutData.bio=bi.value; saveAbout(); renderAbout();
  toast('✅ Bio diperbarui!','success');
}

/* ════════════ ADMIN OPEN/CLOSE ════════════ */
function openAdmin() {
  document.getElementById('admin-overlay').classList.add('open');
  document.body.style.overflow='hidden';
  if(Auth.isLoggedIn()) showAdminDashboard(); else showLoginScreen();
}
function closeAdmin() { document.getElementById('admin-overlay').classList.remove('open'); document.body.style.overflow=''; }
function closeAdminOutside(e) { if(e.target===document.getElementById('admin-overlay')) closeAdmin(); }
function showLoginScreen() {
  document.getElementById('login-state').style.display='flex';
  document.getElementById('admin-state').style.display='none';
  document.getElementById('login-error').classList.remove('visible');
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
}
function showAdminDashboard() {
  document.getElementById('login-state').style.display='none';
  document.getElementById('admin-state').style.display='block';
  renderWorkList(); renderAbout();
}

/* ════════════ LOGIN/LOGOUT ════════════ */
function doLogin() {
  var u=document.getElementById('login-user').value.trim(), p=document.getElementById('login-pass').value;
  var result=Auth.login(u,p);
  if(result.success){ applyAdminMode(true); showAdminDashboard(); toast('✅ Login berhasil!','success'); }
  else document.getElementById('login-error').classList.add('visible');
}
function doLogout() { Auth.logout(); applyAdminMode(false); closeAdmin(); toast('Logout berhasil.',''); }

/* ════════════ TABS ════════════ */
function switchTab(tab, btn) {
  var at=document.querySelectorAll('.admin-tab'), as=document.querySelectorAll('.admin-section');
  for(var i=0;i<at.length;i++) at[i].classList.remove('active');
  for(var i=0;i<as.length;i++) as[i].classList.remove('active');
  if(btn) btn.classList.add('active');
  var sec=document.getElementById('tab-'+tab); if(sec) sec.classList.add('active');
  if(tab==='manage')   renderWorkList();
  if(tab==='settings') fillSettingsForms();
  if(tab==='about')    renderAboutAdminTab();
}

/* ════════════ WORK CRUD ════════════ */
function handleFileSelect(e) { var f=e.target.files[0]; if(f) readWorkFile(f); }
function handleDragOver(e)   { e.preventDefault(); document.getElementById('upload-area').classList.add('dragover'); }
function handleDragLeave()   { document.getElementById('upload-area').classList.remove('dragover'); }
function handleDrop(e) { e.preventDefault(); document.getElementById('upload-area').classList.remove('dragover'); var f=e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) readWorkFile(f); }

function readWorkFile(file) {
  if(file.size>10*1024*1024){ toast('⚠️ File maks 10MB!','error'); return; }
  var reader=new FileReader();
  reader.onload=function(ev){
    uploadedImgData=ev.target.result;
    var prev=document.getElementById('upload-preview'); prev.src=uploadedImgData; prev.style.display='block';
    document.getElementById('upload-text').style.display='none';
    document.getElementById('f-img').value='';
  };
  reader.readAsDataURL(file);
}

function previewFromUrl(url) {
  if(!url) return; uploadedImgData=null;
  document.getElementById('upload-preview').style.display='none';
  document.getElementById('upload-text').style.display='block';
}

function submitWork() {
  var title=document.getElementById('f-title').value.trim();
  var category=document.getElementById('f-category').value;
  var desc=document.getElementById('f-desc').value.trim();
  var tagsRaw=document.getElementById('f-tags').value.trim();
  var year=document.getElementById('f-year').value.trim();
  var imgUrl=document.getElementById('f-img').value.trim();
  var img=uploadedImgData||imgUrl||'';
  var tags=tagsRaw?tagsRaw.split(',').map(function(t){return t.trim();}).filter(Boolean):[];

  if(!title||!category){ toast('⚠️ Judul dan kategori wajib diisi!','error'); return; }

  if(editingId) {
    for(var i=0;i<works.length;i++){
      if(works[i].id===editingId){
        works[i].title=title; works[i].category=category; works[i].desc=desc;
        works[i].tags=tags; works[i].year=year; if(img) works[i].img=img;
        works[i].updatedAt=Date.now(); break;
      }
    }
    toast('✅ Karya berhasil diperbarui!','success'); cancelEdit();
  } else {
    works.unshift({id:'w'+Date.now(),title:title,category:category,desc:desc,tags:tags,year:year,img:img,createdAt:Date.now()});
    toast('✅ Karya berhasil ditambahkan!','success');
  }
  saveWorks(); resetWorkForm(); renderPortfolio(); updateStats(); renderWorkList();
}

function editWork(id) {
  var w=null; for(var i=0;i<works.length;i++){if(works[i].id===id){w=works[i];break;}} if(!w) return;
  editingId=id;
  document.getElementById('f-title').value=w.title;
  document.getElementById('f-category').value=w.category;
  document.getElementById('f-desc').value=w.desc||'';
  document.getElementById('f-tags').value=(w.tags||[]).join(', ');
  document.getElementById('f-year').value=w.year||'';
  document.getElementById('f-img').value='';
  document.getElementById('submit-btn').textContent='Perbarui Karya';
  document.getElementById('edit-mode-banner').classList.add('visible');
  uploadedImgData=null;
  if(w.img){ var prev=document.getElementById('upload-preview'); prev.src=w.img; prev.style.display='block'; document.getElementById('upload-text').style.display='none'; }
  var tabs=document.querySelectorAll('.admin-tab'); switchTab('add',tabs[0]);
  document.getElementById('admin-panel').scrollTo({top:0,behavior:'smooth'});
}

function cancelEdit() {
  editingId=null;
  document.getElementById('submit-btn').textContent='Simpan Karya';
  document.getElementById('edit-mode-banner').classList.remove('visible');
  resetWorkForm();
}

function deleteWork(id) {
  if(!confirm('Yakin ingin menghapus karya ini?')) return;
  works=works.filter(function(w){return w.id!==id;}); saveWorks(); renderPortfolio(); updateStats(); renderWorkList();
  toast('🗑️ Karya dihapus.','');
}

function clearAllWorks() {
  if(!confirm('Hapus SEMUA karya?')) return;
  works=[]; saveWorks(); renderPortfolio(); updateStats(); renderWorkList();
  toast('🗑️ Semua karya dihapus.','');
}

function resetWorkForm() {
  ['f-title','f-category','f-desc','f-tags','f-year','f-img'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  uploadedImgData=null;
  var prev=document.getElementById('upload-preview'); if(prev){prev.style.display='none';prev.src='';}
  var ut=document.getElementById('upload-text'); if(ut) ut.style.display='block';
  var fi=document.getElementById('file-input'); if(fi) fi.value='';
}

function renderWorkList() {
  var list=document.getElementById('work-list'), count=document.getElementById('manage-count');
  if(count) count.textContent=works.length; if(!list) return;
  if(!works.length){ list.innerHTML='<div class="empty-state"><div class="empty-icon">📂</div><p>Belum ada karya.</p></div>'; return; }
  var html='';
  for(var i=0;i<works.length;i++){
    var w=works[i];
    html+='<div class="work-item">';
    html+=w.img?'<img src="'+w.img+'" class="work-thumb" onerror="this.style.opacity=\'0\'" />':'<div class="work-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.4rem">🖼️</div>';
    html+='<div class="work-info"><strong>'+esc(w.title)+'</strong><span>'+catLabel(w.category)+'</span></div>';
    html+='<div class="work-actions"><button class="icon-btn" onclick="editWork(\''+w.id+'\')">✏️</button><button class="icon-btn delete" onclick="deleteWork(\''+w.id+'\')">🗑️</button></div>';
    html+='</div>';
  }
  list.innerHTML=html;
}

/* ════════════ SETTINGS ════════════ */
function fillSettingsForms() {
  var su=document.getElementById('s-user'), sw=document.getElementById('s-wa'), sl=document.getElementById('s-li'), se=document.getElementById('s-em');
  if(su) su.value=Auth.getUsername(); if(sw) sw.value=contactInfo.wa; if(sl) sl.value=contactInfo.li; if(se) se.value=contactInfo.em;
}
function saveCredentialSettings() {
  var u=document.getElementById('s-user').value, p=document.getElementById('s-pass').value, p2=document.getElementById('s-pass2').value;
  var result=Auth.updateCredentials(u,p,p2);
  if(result.success){ document.getElementById('s-pass').value=''; document.getElementById('s-pass2').value=''; toast('✅ '+result.message,'success'); }
  else toast('⚠️ '+result.message,'error');
}
function saveContactSettings() {
  contactInfo.wa=document.getElementById('s-wa').value.trim();
  contactInfo.li=document.getElementById('s-li').value.trim();
  contactInfo.em=document.getElementById('s-em').value.trim();
  saveContact(); applyContactLinks(); toast('✅ Info kontak disimpan!','success');
}
function applyContactLinks() {
  var wa=document.getElementById('wa-link'), li=document.getElementById('li-link'), em=document.getElementById('em-link');
  if(wa) wa.href='https://wa.me/'+contactInfo.wa; if(li) li.href=contactInfo.li; if(em) em.href='mailto:'+contactInfo.em;
}
function resetAllData() {
  if(!confirm('Reset SEMUA data? Tidak bisa dibatalkan!')) return;
  localStorage.clear(); sessionStorage.clear(); location.reload();
}

/* ════════════ SCROLL ════════════ */
function scrollToSection(selector) { var el=document.querySelector(selector); if(el) el.scrollIntoView({behavior:'smooth'}); }

/* ════════════ TOAST ════════════ */
function toast(msg, type) {
  var el=document.getElementById('toast'); el.innerHTML='<span>'+msg+'</span>'; el.className='show '+(type||'');
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){ el.className=''; },3200);
}

/* ════════════ UTIL ════════════ */
function esc(s) { return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''; }
