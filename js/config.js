/**
 * Konfigurasi Website Kuis Detektif GRYA
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 */

window.APP_CONFIG = {
  // Ganti dengan URL Google Apps Script Web App jika ingin langsung menyimpan ke Google Sheets & Google Drive
  // Contoh: "https://script.google.com/macros/s/AKfycbx.../exec"
  // Jika dibiarkan kosong (""), website otomatis menggunakan local backend server (Node.js Express di /api/submit)
  GOOGLE_APPS_SCRIPT_URL: "",

  // KODE KUIS RAHASIA YANG BENAR
  // Sesuai petunjuk teka-teki:
  // - Danu = KPP (I Wayan Sudarmo)
  // - Bima = FLPP (Pak Samin)
  // - Ayu = Bedah Rumah
  // - Citra = Rumah Susun
  // Kode urutan posisi (Bedah Rumah, FLPP, Rusun, KPP): '2134' (atau variasi '1423' / '1234' / 'GRYA2026')
  VALID_QUIZ_CODES: [
    "2134",
    "1423",
    "1234",
    "GRYA2026"
  ],
  PRIMARY_QUIZ_CODE: "2134",

  // Maksimal ukuran upload berkas bukti IG Story (5 MB)
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,

  // Format berkas yang didukung
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/jpg"]
};
