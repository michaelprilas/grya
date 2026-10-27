# Form Kuis Majalah Kementerian PKP: "Detektif GRYA"
### Tema: *"Empat Pintu Satu Kode Rahasia"*

Aplikasi web pengumpulan jawaban kuis majalah resmi **Biro Komunikasi Publik Kementerian Perumahan dan Kawasan Permukiman (PKP)**. Didesain secara responsif untuk pengguna telepon pintar (mobile-first), ringan, modern, dan dilengkapi validasi data ketat serta panel admin pengundian hadiah.

---

## 🎨 Identitas Visual & Desain
Website mengadopsi palet warna resmi sesuai poster kuis majalah:
- **Terakota Utama**: `#D65A3C` (aksen gelap `#B54226`, aksen lembut `#FBF0ED`)
- **Biru Navy**: `#12233F` (aksen gelap `#0A1424`)
- **Krem / Emas**: `#F0D0A0` (aksen terang `#FAF4E9`)
- **Tipografi**: Judul tegas bergaya editorial serif (*DM Serif Display*), dipadukan dengan font badan yang sangat mudah dibaca (*Plus Jakarta Sans*).
- **Dekorasi**: Ornamen bunga line-art elegan khas edisi majalah pada latar belakang dan kartu formulir.
- **Logo Resmi**: Vektor SVG Kementerian PKP di header.

---

## 🧩 Solusi Teka-Teki "Detektif GRYA" & Kunci Jawaban

### 1. Data Temuan Tokoh (Rubrik Cerita Penerima Bantuan):
* **Pak Samin** = Penerima manfaat program **KPR FLPP** (pedagang bakso penerima rumah bersubsidi). Maka **Bima** memegang kartu **FLPP**.
* **I Wayan Sudarmo** = Penerima manfaat program **Kredit Program Perumahan (KPP)** di Bali. Maka **Danu** memegang kartu **KPP**.
* Sisanya adalah **Ayu** dan **Citra**, yang memegang kartu **Bedah Rumah (BSPS)** dan **Rumah Susun (Rusun)**.

### 2. Logika 5 Petunjuk Posisi Rumah (Pintu 1, 2, 3, 4):
1. *Bima berada di salah satu rumah paling ujung* (Rumah 1 atau Rumah 4).
2. *Kartu Rusun tidak berada di rumah paling ujung* (Rumah 2 atau 3).
3. *Kartu Bedah Rumah tepat di sebelah kiri kartu Rusun* &rarr; Pasangan (Bedah Rumah, Rusun) hanya bisa di (1, 2) atau (2, 3).
4. *Citra tepat di sebelah kanan Ayu* &rarr; Pasangan (Ayu, Citra) berdampingan.
5. *Rumah Citra dan Bima tidak berdampingan*.

### 3. Dua Kemungkinan Posisi:
* **Kemungkinan A**:
  - Rumah 1: **Bima** (Kartu **FLPP**)
  - Rumah 2: **Ayu** (Kartu **Bedah Rumah**)
  - Rumah 3: **Citra** (Kartu **Rumah Susun**)
  - Rumah 4: **Danu** (Kartu **KPP**)
  - *Urutan nomor urut peserta sesuai program (Bedah Rumah, FLPP, Rusun, KPP)*:
    - Bedah Rumah = 2
    - FLPP = 1
    - Rumah Susun = 3
    - KPP = 4
    - **Kode Jawaban: `2134`**

* **Kemungkinan B**:
  - Rumah 1: **Ayu** (Kartu **Bedah Rumah**)
  - Rumah 2: **Citra** (Kartu **Rumah Susun**)
  - Rumah 3: **Danu** (Kartu **KPP**)
  - Rumah 4: **Bima** (Kartu **FLPP**)
  - *Urutan nomor urut peserta sesuai program (Bedah Rumah, FLPP, Rusun, KPP)*:
    - Bedah Rumah = 1
    - FLPP = 4
    - Rumah Susun = 2
    - KPP = 3
    - **Kode Jawaban: `1423`**

> **Catatan Fleksibilitas Sistem:**
> Sistem secara otomatis menerima kode **`2134`**, **`1423`**, **`1234`**, maupun **`GRYA2026`** (tidak sensitif huruf besar/kecil dan mengabaikan spasi/strip). Anda juga dapat mengubah atau mengunci kode kuis ke kode khusus kapan saja melalui panel admin atau file konfigurasi.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Menjalankan Server Lokal (Node.js)
```bash
# Masuk ke direktori
cd /Users/michael/.gemini/antigravity/scratch/detektif-grya-pkp

# Jalankan server
npm start
# atau: PORT=3080 node server.js
```
Akses di browser:
- **Formulir Peserta**: [http://localhost:3080/index.html](http://localhost:3080/index.html)
- **Panel Admin**: [http://localhost:3080/admin.html](http://localhost:3080/admin.html)  
  *(Password bawaan: `adminpkp2026`)*

---

## ☁️ Integrasi Google Sheets & Google Drive (Google Apps Script)

Jika Anda ingin data peserta langsung tersimpan ke Google Sheets dan screenshot Instagram Story tersimpan otomatis ke folder Google Drive tanpa perlu memelihara server:

1. Buka [Google Sheets](https://sheets.new) baru.
2. Buka menu **Extensions** > **Apps Script**.
3. Buka file [`google-apps-script/Code.gs`](file:///Users/michael/.gemini/antigravity/scratch/detektif-grya-pkp/google-apps-script/Code.gs), salin semua kodenya ke editor Apps Script.
4. Jalankan fungsi `setupSheet` sekali untuk menyiapkan header kolom otomatis (berwarna terakota kementerian) dan folder Drive.
5. Klik **Deploy** > **New deployment** > pilih **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
6. Salin **Web app URL** yang diberikan Google.
7. Tempelkan URL tersebut ke file [`public/js/config.js`](file:///Users/michael/.gemini/antigravity/scratch/detektif-grya-pkp/public/js/config.js) pada parameter `GOOGLE_APPS_SCRIPT_URL`.

Panduan lengkap bertahap tersedia di file [`google-apps-script/README.md`](file:///Users/michael/.gemini/antigravity/scratch/detektif-grya-pkp/google-apps-script/README.md).

---

## 🛡️ Fitur Keamanan & Validasi Lengkap

1. **Pencegahan Pengiriman Ganda**:
   - Satu NIP (18 digit angka) hanya diperbolehkan mengirim satu kali.
   - Pengecekan realtime langsung saat peserta selesai mengetik 18 digit NIP.
   - Pengecekan di sisi server: jika NIP sudah ada di database/sheet, server menolak dengan pesan *"Data dengan NIP ini sudah pernah terkirim."*
2. **Validasi Formulir Lengkap (Bahasa Indonesia)**:
   - **Nama Lengkap**: minimal 3 karakter.
   - **NIP**: tepat 18 karakter angka.
   - **Unit Organisasi & Unit Kerja**: wajib diisi (tersedia daftar rekomendasi unit Eselon I / Ditjen PKP).
   - **WhatsApp**: normalisasi otomatis format lokal (`08xxx` / `+62xxx`) menjadi standar internasional `628xxx`.
   - **Screenshot Instagram Story**: dibatasi maksimal 5 MB, hanya menerima format gambar JPG / PNG. Menampilkan pratinjau foto sebelum kirim.
   - **Username Instagram**: verifikasi handle peserta (otomatis diberi awalan `@`).
   - **Kode Quiz**: divalidasi dengan pesan *"Kode belum tepat, coba periksa kembali jawabanmu"* disertai animasi getar (*shake effect*) jika salah.
   - **Persetujuan**: klausul wajib centang penggunaan data untuk verifikasi dan undian.
3. **Tanda Terima Unik**:
   - Setelah pengiriman berhasil, peserta menerima kartu bukti dengan nomor unik (contoh: `GRYA-7821`) yang dapat disalin dengan 1 klik.
4. **Panel Admin & Pengundian Hadiah**:
   - Terproteksi kata sandi.
   - Tabel responsif dengan pencarian instan dan filter status (*Semua*, *Terverifikasi*, *Menunggu Verifikasi*, *Ditolak*).
   - Tombol verifikasi 1 klik per peserta.
   - Fitur **"Undi Pemenang"** interaktif dengan animasi acak nama peserta terverifikasi, efek ledakan konfeti perayaan (*confetti*), dan tautan langsung untuk menghubungi pemenang via WhatsApp.
   - Ekspor seluruh data ke file CSV.
5. **Anti-Spam & Rate Limiting**:
   - Pembatasan laju pengiriman form per IP address untuk mencegah serangan spam bot.
