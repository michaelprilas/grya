/**
 * =========================================================================
 * DETEKTIF GRYA - GOOGLE APPS SCRIPT BACKEND
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 * =========================================================================
 * 
 * Skrip ini menangani:
 * 1. Menerima pengiriman data form kuis Detektif GRYA.
 * 2. Mengunggah screenshot bukti Instagram Story ke Google Drive (Folder khusus).
 * 3. Menyimpan data peserta ke Google Sheets (mencegah duplikasi NIP).
 * 4. Menyediakan endpoint untuk sinkronisasi data Admin Dashboard.
 * 
 * PANDUAN DEPLOY:
 * 1. Buat Google Spreadsheet baru di Google Drive Anda.
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus semua kode yang ada, lalu salin dan tempel (paste) seluruh isi file ini.
 * 4. Klik tombol 'Save' (ikon disket).
 * 5. Jalankan fungsi 'setupSheet()' sekali untuk menginisialisasi header kolom.
 * 6. Klik tombol 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan baru).
 * 7. Pilih tipe: 'Web app' (Aplikasi web).
 * 8. Konfigurasi:
 *    - Description: "Detektif GRYA Form Endpoint v1"
 *    - Execute as: "Me" (Saya / akun email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja - PENTING agar peserta dapat mengirim data tanpa login Google)
 * 9. Klik 'Deploy', lalu 'Authorize access' (Berikan izin).
 * 10. Salin 'Web App URL' yang dihasilkan, dan tempelkan ke konfigurasi website (config.js atau .env).
 * =========================================================================
 */

// KONFIGURASI SISTEM
const CONFIG = {
  // Nama folder di Google Drive untuk menyimpan tangkapan layar bukti Instagram
  DRIVE_FOLDER_NAME: "Detektif GRYA - Bukti Instagram",
  
  // Nama sheet tab penyimpanan data
  SHEET_NAME: "Data Peserta",
  
  // Daftar kode quiz yang diterima (huruf besar/kecil dan spasi akan dinormalisasi otomatis)
  // Kunci jawaban teka-teki: 2134 (atau variasi 1423, 1234, GRYA2026)
  VALID_QUIZ_CODES: ["2134", "1423", "1234", "GRYA2026"],
  
  // Password akses admin untuk mengambil data melalui GET (jika diperlukan)
  ADMIN_PASSWORD: "adminpkp2026"
};

/**
 * Inisialisasi sheet & folder otomatis
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  // Header kolom yang disyaratkan
  const headers = [
    "Timestamp",
    "Kode Unik",
    "Nama Lengkap",
    "NIP",
    "Unit Organisasi",
    "Unit Kerja",
    "Nomor WhatsApp",
    "Username Instagram",
    "Kode Quiz",
    "Status Verifikasi",
    "Link Screenshot"
  ];
  
  // Format header baris pertama
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight("bold");
  range.setBackground("#D65A3C"); // Warna Terakota Kementerian PKP
  range.setFontColor("#FFFFFF");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  // Auto-fit kolom
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
  
  // Pastikan folder Drive dibuat
  getOrCreateDriveFolder();
  Logger.log("Setup sheet & folder berhasil!");
}

/**
 * Mencari atau membuat folder penyimpanan di Google Drive
 */
function getOrCreateDriveFolder() {
  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
  // Berikan akses agar file bisa dilihat oleh admin
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

/**
 * Menghandle request POST (pengiriman jawaban form)
 */
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      // Cek apakah konten berupa JSON atau Form URL Encoded
      if (e.postData.type === "application/json" || e.postData.contents.startsWith("{")) {
        data = JSON.parse(e.postData.contents);
      } else {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    // 1. Validasi Keberadaan Data
    const nama = (data.nama || "").trim();
    const nip = (data.nip || "").replace(/\D/g, ""); // hanya angka
    const unitOrganisasi = (data.unitOrganisasi || "").trim();
    const unitKerja = (data.unitKerja || "").trim();
    let whatsapp = (data.whatsapp || "").replace(/\D/g, "");
    let instagram = (data.instagram || "").trim();
    const kodeQuiz = (data.kodeQuiz || "").trim().toUpperCase().replace(/[\s-]/g, "");
    const persetujuan = data.persetujuan === true || data.persetujuan === "true" || data.persetujuan === "on";

    // 2. Validasi Server-Side
    if (!nama || nama.length < 3) {
      return jsonResponse({ success: false, message: "Nama lengkap harus diisi minimal 3 karakter." });
    }

    if (!nip || nip.length !== 18) {
      return jsonResponse({ success: false, message: "NIP harus berupa angka 18 digit yang valid." });
    }

    if (!unitOrganisasi) {
      return jsonResponse({ success: false, message: "Unit Organisasi wajib diisi." });
    }

    if (!unitKerja) {
      return jsonResponse({ success: false, message: "Unit Kerja wajib diisi." });
    }

    // Normalisasi WhatsApp ke 62xxx
    if (whatsapp.startsWith("0")) {
      whatsapp = "62" + whatsapp.substring(1);
    } else if (whatsapp.startsWith("8")) {
      whatsapp = "62" + whatsapp;
    }
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      return jsonResponse({ success: false, message: "Nomor WhatsApp tidak valid. Format harus 08xxx atau 62xxx." });
    }

    // Normalisasi Instagram handle
    if (instagram && !instagram.startsWith("@")) {
      instagram = "@" + instagram;
    }
    if (!instagram || instagram.length < 2) {
      return jsonResponse({ success: false, message: "Username Instagram wajib diisi." });
    }

    // Validasi Kode Quiz
    const isValidCode = CONFIG.VALID_QUIZ_CODES.some(c => c.toUpperCase().replace(/[\s-]/g, "") === kodeQuiz);
    if (!isValidCode) {
      return jsonResponse({
        success: false,
        errorCode: "INVALID_QUIZ_CODE",
        message: "Kode belum tepat, coba periksa kembali jawabanmu"
      });
    }

    if (!persetujuan) {
      return jsonResponse({ success: false, message: "Anda harus menyetujui ketentuan penggunaan data kuis." });
    }

    // 3. Akses Spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    }

    // 4. Validasi Duplikasi NIP (Satu NIP hanya boleh satu kali)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      // Ambil seluruh data NIP di Kolom D (kolom 4)
      const nipList = sheet.getRange(2, 4, lastRow - 1, 1).getValues().map(row => String(row[0]).trim());
      if (nipList.includes(nip)) {
        return jsonResponse({
          success: false,
          errorCode: "DUPLICATE_NIP",
          message: "Data dengan NIP ini sudah pernah terkirim."
        });
      }
    }

    // 5. Simpan Screenshot ke Google Drive
    let screenshotUrl = "-";
    if (data.screenshotBase64) {
      try {
        const folder = getOrCreateDriveFolder();
        let base64Clean = data.screenshotBase64;
        let mimeType = MimeType.JPEG;
        let ext = "jpg";

        if (base64Clean.indexOf("data:image/png;base64,") !== -1) {
          base64Clean = base64Clean.replace(/^data:image\/png;base64,/, "");
          mimeType = MimeType.PNG;
          ext = "png";
        } else if (base64Clean.indexOf("data:image/jpeg;base64,") !== -1) {
          base64Clean = base64Clean.replace(/^data:image\/jpeg;base64,/, "");
          mimeType = MimeType.JPEG;
          ext = "jpg";
        }

        const decodedBytes = Utilities.base64Decode(base64Clean);
        const fileName = `IGStory_${nip}_${Date.now()}.${ext}`;
        const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        screenshotUrl = file.getUrl();
      } catch (errUpload) {
        Logger.log("Gagal mengunggah file: " + errUpload.toString());
        screenshotUrl = "Gagal upload: " + errUpload.message;
      }
    }

    // 6. Buat Kode Unik Bukti Peserta (Format: GRYA-XXXX)
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const uniqueCode = "GRYA-" + randomHex;

    // 7. Simpan Baris Data ke Spreadsheet
    const timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    const statusVerifikasi = "Menunggu Verifikasi";

    sheet.appendRow([
      timestamp,
      uniqueCode,
      nama,
      "'" + nip, // Format sebagai string teks agar 18 digit tidak dibulatkan
      unitOrganisasi,
      unitKerja,
      "'" + whatsapp,
      instagram,
      kodeQuiz,
      statusVerifikasi,
      screenshotUrl
    ]);

    // 8. Kembalikan Respon Sukses
    return jsonResponse({
      success: true,
      message: "Terima kasih, jawabanmu sudah kami terima! Pemenang akan diumumkan sesuai jadwal.",
      data: {
        nama: nama,
        nip: nip,
        kodeUnik: uniqueCode,
        timestamp: timestamp
      }
    });

  } catch (error) {
    Logger.log("Error doPost: " + error.toString());
    return jsonResponse({
      success: false,
      message: "Terjadi kesalahan pada server saat memproses jawaban: " + error.message
    });
  }
}

/**
 * Menghandle request GET (Cek status atau Admin Fetch)
 */
function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : "";
    
    // Cek duplikasi NIP secara cepat sebelum submit
    if (action === "checkNip") {
      const targetNip = (e.parameter.nip || "").replace(/\D/g, "");
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse({ exists: false });
      }
      const nipList = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues().map(r => String(r[0]).trim());
      return jsonResponse({ exists: nipList.includes(targetNip) });
    }

    // Admin API untuk menarik daftar peserta
    if (action === "getSubmissions") {
      const pwd = e.parameter.password || "";
      if (pwd !== CONFIG.ADMIN_PASSWORD) {
        return jsonResponse({ success: false, message: "Akses ditolak: Password admin salah." });
      }
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse({ success: true, submissions: [] });
      }

      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
      const list = rows.map((r, idx) => ({
        rowNumber: idx + 2,
        timestamp: r[0],
        kodeUnik: r[1],
        nama: r[2],
        nip: String(r[3]),
        unitOrganisasi: r[4],
        unitKerja: r[5],
        whatsapp: String(r[6]),
        instagram: r[7],
        kodeQuiz: r[8],
        statusVerifikasi: r[9],
        linkScreenshot: r[10]
      }));

      return jsonResponse({ success: true, submissions: list });
    }

    // Admin API untuk mengubah status verifikasi di Google Sheets
    if (action === "updateStatus") {
      const pwd = e.parameter.password || "";
      if (pwd !== CONFIG.ADMIN_PASSWORD) {
        return jsonResponse({ success: false, message: "Akses ditolak: Password admin salah." });
      }
      const targetId = (e.parameter.id || "").trim();
      const newStatus = (e.parameter.status || "").trim();
      const allowed = ["Menunggu Verifikasi", "Terverifikasi", "Ditolak"];
      if (!allowed.includes(newStatus)) {
        return jsonResponse({ success: false, message: "Status tidak valid." });
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse({ success: false, message: "Data spreadsheet masih kosong." });
      }

      const lastRow = sheet.getLastRow();
      let targetRow = -1;

      // Cari berdasarkan Kode Unik di Kolom B (kolom 2)
      const codeColumn = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (let i = 0; i < codeColumn.length; i++) {
        if (String(codeColumn[i][0]).trim().toUpperCase() === targetId.toUpperCase()) {
          targetRow = i + 2;
          break;
        }
      }

      // Jika tidak ditemukan dengan kode unik, cari berdasarkan rowNumber
      if (targetRow === -1) {
        const rowNum = parseInt(targetId, 10);
        if (!isNaN(rowNum) && rowNum >= 2 && rowNum <= lastRow) {
          targetRow = rowNum;
        }
      }

      if (targetRow !== -1) {
        // Kolom J (kolom 10) adalah Status Verifikasi
        sheet.getRange(targetRow, 10).setValue(newStatus);
        return jsonResponse({
          success: true,
          message: "Status berhasil diubah menjadi: " + newStatus,
          id: targetId,
          status: newStatus
        });
      } else {
        return jsonResponse({ success: false, message: "Peserta tidak ditemukan di baris data." });
      }
    }

    // Default status ping
    return jsonResponse({
      status: "online",
      service: "Detektif GRYA - Backend Kuis Kementerian PKP",
      timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
    });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

/**
 * Helper JSON Response
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
