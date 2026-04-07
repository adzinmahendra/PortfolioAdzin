# 🎨 Adzin Mahendra — Portfolio

Portfolio profesional untuk Graphic & UI/UX Designer dengan sistem admin.

## 📁 Struktur Proyek

```
portfolio-adzin/
├── index.html          ← Struktur HTML (markup saja)
├── css/
│   └── style.css       ← Semua styling & animasi
├── js/
│   ├── auth.js         ← Autentikasi & manajemen sesi
│   └── app.js          ← Logic utama aplikasi & CRUD
├── vercel.json         ← Konfigurasi Vercel
└── README.md
```

## 🔑 Login Admin Default

```
Username : admin
Password : admin123
```

> ⚠️ Ganti di Panel Admin → Pengaturan setelah deploy pertama kali.

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| 🖼️ Galeri Portfolio | Grid karya dengan filter kategori |
| 🔍 Lightbox | Preview detail saat klik karya |
| 📸 Foto Profil | Upload & simpan foto di About Me |
| ✏️ Edit Bio | Klik teks bio untuk edit langsung (mode admin) |
| 🔐 Panel Admin | Login aman, CRUD karya, pengaturan |
| 💾 Data Persisten | Semua data tersimpan di localStorage (tidak hilang saat refresh) |
| 📬 Kontak | WhatsApp, LinkedIn, Email — bisa diubah dari panel |
| 📱 Responsive | Mobile-friendly |

## 🚀 Deploy ke Vercel

### Cara 1 — Drag & Drop (Termudah)
1. Buka [vercel.com/new](https://vercel.com/new)
2. Drag & drop **seluruh folder** `portfolio-adzin` ke halaman tersebut
3. Framework Preset: **Other** (biarkan default)
4. Klik **Deploy** ✅

### Cara 2 — Via GitHub
1. Buat repository baru di GitHub
2. Upload semua file (pertahankan struktur folder `css/` dan `js/`)
3. Buka [vercel.com](https://vercel.com) → **New Project** → Import dari GitHub
4. Klik **Deploy** ✅

### Cara 3 — Vercel CLI
```bash
npm i -g vercel
cd portfolio-adzin
vercel --prod
```

## ⚠️ Catatan Penting

- Data portfolio disimpan di **localStorage** browser pengunjung.  
  Artinya: data hanya ada di browser tempat admin login.
- Untuk production yang serius, pertimbangkan backend seperti Supabase atau Firebase.
- Foto yang diupload disimpan sebagai base64 — file besar bisa memperlambat load.

## 📞 Kontak Default (ubah di Admin → Pengaturan)

- WhatsApp: `6281234567890`
- LinkedIn: `https://linkedin.com/in/adzinmahendra`  
- Email: `adzin.mahendra@email.com`
# PortfolioAdzin
