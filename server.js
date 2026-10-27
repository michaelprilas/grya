/**
 * Detektif GRYA - Backend Server (Node.js & Express)
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3080;

// Konfigurasi Direktori
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Pastikan folder ada
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Inisialisasi file konfigurasi
const DEFAULT_CONFIG = {
  adminPassword: process.env.ADMIN_PASSWORD || 'adminpkp2026',
  // Jawaban kuis: 2134 (atau variasi 1423, 1234, GRYA2026)
  validQuizCodes: ['2134', '1423', '1234', 'GRYA2026'],
  primaryQuizCode: '2134',
  googleAppsScriptUrl: process.env.APPS_SCRIPT_URL || ''
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    return DEFAULT_CONFIG;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

// Inisialisasi database data submissions
function loadSubmissions() {
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveSubmissions(list) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (Frontend & Uploads)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Rate Limiter untuk mencegah spam form (Maksimal 10 submit per 10 menit per IP)
const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari perangkat Anda. Silakan coba kembali dalam beberapa menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Konfigurasi Multer untuk upload file screenshot
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const nip = (req.body.nip || 'temp').replace(/\D/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
    cb(null, `bukti-${nip}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: function (req, file, cb) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung! Harap unggah gambar JPG atau PNG.'));
    }
  }
});

// Helper normalisasi nomor WA
function normalizeWhatsApp(wa) {
  let clean = wa.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.substring(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Cek apakah NIP sudah pernah terdaftar
app.get('/api/check-nip/:nip', (req, res) => {
  const nip = (req.params.nip || '').replace(/\D/g, '');
  if (!nip || nip.length !== 18) {
    return res.json({ exists: false, validFormat: false });
  }
  const submissions = loadSubmissions();
  const exists = submissions.some(item => item.nip === nip);
  return res.json({ exists, validFormat: true });
});

// 2. Submit Form Jawaban
app.post('/api/submit', submissionLimiter, upload.single('screenshot'), async (req, res) => {
  try {
    const config = loadConfig();
    const {
      nama,
      nip,
      unitOrganisasi,
      unitKerja,
      whatsapp,
      instagram,
      kodeQuiz,
      persetujuan
    } = req.body;

    // Validasi Nama
    if (!nama || nama.trim().length < 3) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Nama Lengkap minimal 3 karakter.' });
    }

    // Validasi NIP (18 digit angka)
    const cleanNip = (nip || '').replace(/\D/g, '');
    if (!cleanNip || cleanNip.length !== 18) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'NIP harus terdiri dari 18 digit angka.' });
    }

    // Validasi Unit
    if (!unitOrganisasi || !unitOrganisasi.trim()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Unit Organisasi wajib diisi.' });
    }

    if (!unitKerja || !unitKerja.trim()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Unit Kerja wajib diisi.' });
    }

    // Validasi WhatsApp
    const cleanWa = normalizeWhatsApp(whatsapp || '');
    if (cleanWa.length < 10 || cleanWa.length > 15) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp tidak valid (contoh: 08123456789).' });
    }

    // Validasi Instagram
    let cleanIg = (instagram || '').trim();
    if (cleanIg && !cleanIg.startsWith('@')) {
      cleanIg = '@' + cleanIg;
    }
    if (!cleanIg || cleanIg.length < 2) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Username Instagram wajib diisi.' });
    }

    // Validasi Kode Quiz
    const cleanQuizCode = (kodeQuiz || '').trim().toUpperCase().replace(/[\s-]/g, '');
    const isCodeValid = config.validQuizCodes.some(c => c.toUpperCase().replace(/[\s-]/g, '') === cleanQuizCode);
    if (!isCodeValid) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_QUIZ_CODE',
        message: 'Kode belum tepat, coba periksa kembali jawabanmu'
      });
    }

    // Validasi File Bukti Screenshot
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Screenshot bukti Instagram Story wajib diunggah.' });
    }

    // Validasi Persetujuan
    if (persetujuan !== true && persetujuan !== 'true' && persetujuan !== 'on') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Anda harus menyetujui ketentuan dan verifikasi data.' });
    }

    // CEGAH PENGIRIMAN GANDA: Cek apakah NIP sudah pernah terdaftar
    const submissions = loadSubmissions();
    const isDuplicate = submissions.some(sub => sub.nip === cleanNip);
    if (isDuplicate) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({
        success: false,
        errorCode: 'DUPLICATE_NIP',
        message: 'Data dengan NIP ini sudah pernah terkirim.'
      });
    }

    // Buat Kode Unik Bukti Peserta: GRYA-XXXX
    const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
    const kodeUnik = `GRYA-${uniqueNumber}`;
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const screenshotUrl = `/uploads/${req.file.filename}`;

    const newRecord = {
      id: 'sub_' + Date.now(),
      timestamp,
      kodeUnik,
      nama: nama.trim(),
      nip: cleanNip,
      unitOrganisasi: unitOrganisasi.trim(),
      unitKerja: unitKerja.trim(),
      whatsapp: cleanWa,
      instagram: cleanIg,
      kodeQuiz: cleanQuizCode,
      statusVerifikasi: 'Menunggu Verifikasi',
      screenshotUrl,
      createdAt: new Date().toISOString()
    };

    submissions.push(newRecord);
    saveSubmissions(submissions);

    // Kirim respons sukses ke peserta
    return res.json({
      success: true,
      message: 'Terima kasih, jawabanmu sudah kami terima! Pemenang akan diumumkan sesuai jadwal.',
      data: {
        nama: newRecord.nama,
        nip: newRecord.nip,
        kodeUnik: newRecord.kodeUnik,
        timestamp: newRecord.timestamp
      }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat menyimpan data: ' + error.message
    });
  }
});

// Middleware Proteksi Admin
function requireAdmin(req, res, next) {
  const config = loadConfig();
  const authHeader = req.headers['x-admin-password'] || req.query.password || req.body.password;
  if (!authHeader || authHeader !== config.adminPassword) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Password admin tidak sah.' });
  }
  next();
}

// 3. Admin: Ambil Daftar Peserta
app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  const submissions = loadSubmissions();
  const config = loadConfig();
  const statusFilter = req.query.status;

  let filtered = submissions;
  if (statusFilter && statusFilter !== 'Semua') {
    filtered = filtered.filter(item => item.statusVerifikasi === statusFilter);
  }

  // Ringkasan statistik
  const stats = {
    total: submissions.length,
    terverifikasi: submissions.filter(s => s.statusVerifikasi === 'Terverifikasi').length,
    menunggu: submissions.filter(s => s.statusVerifikasi === 'Menunggu Verifikasi').length,
    ditolak: submissions.filter(s => s.statusVerifikasi === 'Ditolak').length
  };

  return res.json({
    success: true,
    stats,
    currentQuizCode: config.primaryQuizCode,
    submissions: filtered.slice().reverse() // Terbaru di atas
  });
});

// 4. Admin: Ubah Status Verifikasi
app.post('/api/admin/verify', requireAdmin, (req, res) => {
  const { id, status } = req.body;
  const allowed = ['Menunggu Verifikasi', 'Terverifikasi', 'Ditolak'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status tidak valid.' });
  }

  const submissions = loadSubmissions();
  const item = submissions.find(s => s.id === id || s.kodeUnik === id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan.' });
  }

  item.statusVerifikasi = status;
  saveSubmissions(submissions);

  return res.json({ success: true, message: `Status berhasil diubah menjadi: ${status}` });
});

// 5. Admin: Undi Pemenang Secara Acak dari Peserta Terverifikasi
app.post('/api/admin/draw-winner', requireAdmin, (req, res) => {
  const submissions = loadSubmissions();
  const verifiedList = submissions.filter(s => s.statusVerifikasi === 'Terverifikasi');

  if (verifiedList.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Belum ada peserta dengan status "Terverifikasi". Silakan verifikasi data peserta terlebih dahulu sebelum mengundi pemenang.'
    });
  }

  const randomIndex = Math.floor(Math.random() * verifiedList.length);
  const winner = verifiedList[randomIndex];

  return res.json({
    success: true,
    winner: {
      nama: winner.nama,
      nip: winner.nip,
      unitOrganisasi: winner.unitOrganisasi,
      unitKerja: winner.unitKerja,
      whatsapp: winner.whatsapp,
      instagram: winner.instagram,
      kodeUnik: winner.kodeUnik,
      timestamp: winner.timestamp
    },
    totalPool: verifiedList.length
  });
});

// 6. Admin: Update Kode Quiz Rahasia
app.post('/api/admin/config/quiz-code', requireAdmin, (req, res) => {
  const { newCode } = req.body;
  if (!newCode || newCode.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Kode kuis baru tidak boleh kosong.' });
  }

  const clean = newCode.trim().toUpperCase().replace(/[\s-]/g, '');
  const config = loadConfig();
  if (!config.validQuizCodes.includes(clean)) {
    config.validQuizCodes.unshift(clean);
  }
  config.primaryQuizCode = clean;
  saveConfig(config);

  return res.json({
    success: true,
    message: `Kode kuis rahasia berhasil diperbarui menjadi: ${clean}`,
    primaryQuizCode: config.primaryQuizCode
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar! Maksimal 5 MB.' });
    }
    return res.status(400).json({ success: false, message: 'Kesalahan unggah berkas: ' + err.message });
  }
  return res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan internal server.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` Detektif GRYA - Web Form Kementerian PKP`);
  console.log(` Server berjalan di http://localhost:${PORT}`);
  console.log(` Halaman Utama: http://localhost:${PORT}/index.html`);
  console.log(` Halaman Admin: http://localhost:${PORT}/admin.html`);
  console.log(`===================================================`);
});
