SIPETA — Sistem Informasi Pemupukan dan Evaluasi Tanaman
========================================================

ISI FOLDER
- Code.gs    : server-side Google Apps Script, autentikasi dan CRUD
- index.html : antarmuka responsif (HTML, CSS, JavaScript)

CARA INSTALASI
1. Buat Google Spreadsheet baru sebagai database SIPETA.
2. Dari Spreadsheet: Extensions (Ekstensi) > Apps Script.
3. Hapus kode default di Code.gs lalu tempel isi file Code.gs dari paket ini.
4. Klik tombol + di editor Apps Script > HTML, beri nama persis: index
   (tanpa .html), lalu tempel isi index.html.
5. Pastikan Apps Script terhubung ke Spreadsheet yang dibuat (bound script).
6. Simpan proyek. Jalankan fungsi doGet sekali dari editor, berikan izin yang diminta.
   Fungsi ini otomatis membuat sheet: Users, Farms, Calculations, Activities,
   Schedules, Inventory.
7. Deploy > New deployment > pilih Web app.
   Execute as: Me
   Who has access: Anyone (atau sesuai kebijakan organisasi).
8. Klik Deploy, salin URL Web App, lalu buka di browser/HP.

CATATAN PENTING
- Password di database disimpan sebagai SHA-256 hash, bukan teks biasa.
- Token sesi disimpan di CacheService (masa aktif 6 jam).
- Login Google, reset password email, unggah foto, peta lokasi, PDF/XLSX native,
  serta trigger email/notifikasi belum diimplementasikan. Export laporan tersedia dalam CSV
  yang dapat dibuka dengan Excel.
- Kalkulator saat ini memakai dosis input kg/pohon/tahun dan populasi total.
  Rekomendasi agronomis harus divalidasi dengan analisis tanah/daun dan rekomendasi ahli.
- Untuk aplikasi produksi, pertimbangkan pembatasan akses deployment, validasi tambahan,
  kebijakan privasi, dan mekanisme pemulihan akun.
