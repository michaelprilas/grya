# Panduan Integrasi Google Sheets & Google Drive (Google Apps Script)
### Kuis Majalah Kementerian Perumahan dan Kawasan Permukiman (PKP) — "Detektif GRYA"

Sistem ini mendukung pengiriman langsung dari form website ke **Google Sheets** dan mengunggah tangkapan layar bukti Instagram Story secara otomatis ke **Google Drive**.

---

## Langkah 1: Buat Spreadsheet Baru
1. Buka browser dan kunjungi [Google Sheets](https://sheets.new).
2. Beri nama spreadsheet, contohnya: **`Data Kuis Majalah PKP - Detektif GRYA`**.

---

## Langkah 2: Buka Apps Script
1. Pada menu navigasi Google Sheets, klik **Extensions** (Ekstensi) > **Apps Script**.
2. Anda akan diarahkan ke editor kode Google Apps Script.
3. Hapus seluruh baris kode contoh `function myFunction() { ... }` yang ada di editor.

---

## Langkah 3: Salin Kode `Code.gs`
1. Buka file [`google-apps-script/Code.gs`](file:///Users/michael/.gemini/antigravity/scratch/detektif-grya-pkp/google-apps-script/Code.gs).
2. Salin (**Ctrl+A** lalu **Ctrl+C**) seluruh kodenya.
3. Tempel (**Ctrl+V**) ke dalam editor Google Apps Script.
4. Klik tombol **Save** (ikon disket) atau tekan `Ctrl+S`.

---

## Langkah 4: Inisialisasi Header Kolom (Sekali Saja)
1. Di bar atas editor, pada dropdown fungsi (di sebelah tombol *Debug*), pilih fungsi **`setupSheet`**.
2. Klik tombol **Run** (Jalankan).
3. Google akan meminta izin (*Authorization Required*):
   - Klik **Review permissions** / **Tinjau Izin**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** (Lanjutan) di kiri bawah, lalu klik **Go to Untitled project (unsafe)**.
   - Klik **Allow** (Izinkan).
4. Setelah selesai, cek kembali tab Google Sheet Anda: baris 1 sudah terisi header rapi dengan latar belakang warna terakota khas Kementerian PKP (#D65A3C).
5. Di Google Drive Anda juga otomatis dibuatkan folder bernama **`Detektif GRYA - Bukti Instagram`**.

---

## Langkah 5: Terapkan Sebagai Web App (Deploy)
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon gerigi (Select type) di kiri atas pop-up, pilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `Detektif GRYA Form v1`
   - **Execute as**: `Me (email-anda@gmail.com)`
   - **Who has access**: `Anyone` *(PENTING: Jangan pilih 'Only myself' agar peserta dapat mengirim form tanpa login akun Google)*.
4. Klik **Deploy**.
5. Salin URL yang muncul di bagian **Web app URL** (contoh: `https://script.google.com/macros/s/AKfycbx.../exec`).

---

## Langkah 6: Hubungkan ke Website
1. Buka file [`public/js/config.js`](file:///Users/michael/.gemini/antigravity/scratch/detektif-grya-pkp/public/js/config.js) di proyek website ini.
2. Tempelkan URL yang sudah Anda salin ke variabel `GOOGLE_APPS_SCRIPT_URL`:
   ```javascript
   GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
   ```
3. Selesai! Sekarang setiap kali peserta mengirimkan form, data akan masuk ke Google Sheet secara realtime dan file screenshot otomatis tersimpan di Google Drive.

---

## Kolom Data yang Disimpan di Google Sheets:
| No | Nama Kolom | Keterangan |
|---|---|---|
| A | **Timestamp** | Waktu pengiriman (Zona Waktu WIB) |
| B | **Kode Unik** | Format `GRYA-XXXX` sebagai tanda terima peserta |
| C | **Nama Lengkap** | Minimal 3 karakter |
| D | **NIP** | 18 digit angka unik (mencegah duplikasi) |
| E | **Unit Organisasi** | Eselon I / Direktorat |
| F | **Unit Kerja** | Bagian / Subdit / Balai |
| G | **Nomor WhatsApp** | Format standar `628xxx` |
| H | **Username Instagram** | Format `@username` |
| I | **Kode Quiz** | Jawaban kode rahasia kuis |
| J | **Status Verifikasi** | `Menunggu Verifikasi`, `Terverifikasi`, atau `Ditolak` |
| K | **Link Screenshot** | Tautan langsung file screenshot di Google Drive |
