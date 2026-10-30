/**
 * =========================================================================
 * DETEKTIF GRYA - GOOGLE APPS SCRIPT BACKEND (EDISI MAJALAH GRYA II)
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 * =========================================================================
 * 
 * Form Input:
 * 1. Nama Lengkap
 * 2. Nomor WhatsApp
 * 3. Alamat Pengiriman Hadiah apabila menang
 * 4. Bukti Upload Story (Tangkapan layar IG Story + Username IG)
 * 5. Kode Quiz (Kode Rahasia Teka-Teki)
 * 
 * PANDUAN PEMBARUAN DI GOOGLE APPS SCRIPT:
 * 1. Buka spreadsheet Google Sheets Anda.
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus kode lama, lalu paste seluruh isi file ini.
 * 4. Klik ikon 'Save' (Simpan).
 * 5. Klik 'Deploy' (Terapkan) > 'Manage deployments' (Kelola penerapan).
 * 6. Klik ikon pensil (Edit) pada deployment aktif.
 * 7. Pada dropdown 'Version' (Versi), pilih 'New version' (Versi baru).
 * 8. Klik 'Deploy'. Selesai!
 * =========================================================================
 */

const CONFIG = {
  // Nama folder di Google Drive untuk menyimpan tangkapan layar bukti Instagram
  DRIVE_FOLDER_NAME: "Detektif GRYA - Bukti Instagram",

  // Nama sheet tab penyimpanan data
  SHEET_NAME: "Data Peserta",
  
  // Daftar kode quiz yang diterima (default: 2134)
  VALID_QUIZ_CODES: ["2134", "1423", "1234", "GRYA2026"],

  // Password akses admin
  ADMIN_PASSWORD: "adminpkp2026"
};

/**
 * Inisialisasi sheet otomatis
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  // Header kolom lengkap
  const headers = [
    "Timestamp",
    "Kode Unik",
    "Nama Lengkap",
    "Nomor WhatsApp",
    "Alamat Pengiriman Hadiah",
    "Username Instagram",
    "Kode Quiz",
    "Status Verifikasi",
    "Link Screenshot"
  ];
  
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight("bold");
  range.setBackground("#D65A3C"); // Terakota PKP
  range.setFontColor("#FFFFFF");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
  
  getOrCreateDriveFolder();
  Logger.log("Setup sheet berhasil!");
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
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

/**
 * Menghandle request POST (pengiriman data form kuis)
 */
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      if (e.postData.type === "application/json" || e.postData.contents.startsWith("{")) {
        data = JSON.parse(e.postData.contents);
      } else {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    // 1. Ekstrak Data
    const nama = (data.nama || "").trim();
    let whatsapp = (data.whatsapp || "").replace(/\D/g, "");
    const alamat = (data.alamat || data.alamatPengiriman || data.unitKerja || "").trim();
    let instagram = (data.instagram || "").trim();
    const kodeQuiz = (data.kodeQuiz || "").trim().toUpperCase().replace(/[\s-]/g, "") || "2134";

    // 2. Validasi Server-Side
    if (!nama || nama.length < 3) {
      return jsonResponse({ success: false, message: "Nama lengkap minimal 3 karakter." });
    }

    // Normalisasi WhatsApp ke 628xxx
    if (whatsapp.startsWith("0")) {
      whatsapp = "62" + whatsapp.substring(1);
    } else if (whatsapp.startsWith("8")) {
      whatsapp = "62" + whatsapp;
    }
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      return jsonResponse({ success: false, message: "Nomor WhatsApp tidak valid (format: 08xxx atau 62xxx)." });
    }

    if (!alamat || alamat.length < 10) {
      return jsonResponse({ success: false, message: "Alamat pengiriman hadiah minimal 10 karakter." });
    }

    if (instagram && !instagram.startsWith("@")) {
      instagram = "@" + instagram;
    }

    // Validasi Kode Kuis
    const isValidCode = CONFIG.VALID_QUIZ_CODES.some(c => c.toUpperCase().replace(/[\s-]/g, "") === kodeQuiz);
    if (kodeQuiz && !isValidCode) {
      return jsonResponse({
        success: false,
        errorCode: "INVALID_QUIZ_CODE",
        message: "Kode belum tepat, coba periksa kembali jawabanmu"
      });
    }

    // 3. Akses Spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    }

    // 4. Deteksi Header Kolom di Spreadsheet (Dinamis)
    const lastRow = sheet.getLastRow();
    const lastCol = Math.max(sheet.getLastColumn(), 6);
    const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim().toLowerCase());
    
    // Cari kolom WhatsApp untuk anti-duplikasi
    let waColIndex = 4;
    for (let c = 0; c < headerRow.length; c++) {
      if (headerRow[c].includes("whatsapp")) {
        waColIndex = c + 1;
        break;
      }
    }

    // Cek Duplikasi WhatsApp
    if (lastRow > 1) {
      const waList = sheet.getRange(2, waColIndex, lastRow - 1, 1)
        .getValues()
        .map(row => String(row[0]).replace(/\D/g, "").trim());

      if (waList.includes(whatsapp)) {
        return jsonResponse({
          success: false,
          errorCode: "DUPLICATE_WA",
          message: "Nomor WhatsApp ini sudah pernah terdaftar untuk undian."
        });
      }
    }

    // 5. Simpan Screenshot ke Google Drive (jika ada)
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
        const fileName = `IGStory_${whatsapp}_${Date.now()}.${ext}`;
        const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        screenshotUrl = file.getUrl();
      } catch (errUpload) {
        Logger.log("Gagal upload foto: " + errUpload.toString());
        screenshotUrl = "Gagal upload: " + errUpload.message;
      }
    }

    // 6. Buat Kode Unik Bukti Peserta (Format: GRYA-XXXX)
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const uniqueCode = "GRYA-" + randomHex;
    const timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    const statusVerifikasi = "Menunggu Verifikasi";

    // 7. Simpan Baris Data Secara Cerdas Sesuai Header Kolom yang Ada di Sheet
    const newRow = new Array(headerRow.length).fill("");

    for (let c = 0; c < headerRow.length; c++) {
      const h = headerRow[c];
      if (h.includes("timestamp")) newRow[c] = timestamp;
      else if (h.includes("kode unik")) newRow[c] = uniqueCode;
      else if (h.includes("nama")) newRow[c] = nama;
      else if (h.includes("whatsapp")) newRow[c] = "'" + whatsapp;
      else if (h.includes("alamat")) newRow[c] = alamat;
      else if (h.includes("instagram")) newRow[c] = instagram || "-";
      else if (h.includes("quiz") || h.includes("kode")) newRow[c] = kodeQuiz;
      else if (h.includes("status")) newRow[c] = statusVerifikasi;
      else if (h.includes("screenshot") || h.includes("bukti")) newRow[c] = screenshotUrl;
      else if (h.includes("unit kerja")) newRow[c] = alamat;
      else if (h.includes("unit organisasi")) newRow[c] = "Alamat Pengiriman";
      else if (h.includes("nip")) newRow[c] = "'" + ('000000' + whatsapp).slice(-18);
    }

    sheet.appendRow(newRow);

    // 8. Respon Sukses
    return jsonResponse({
      success: true,
      message: "Terima kasih, jawaban kuis Anda sudah kami terima! Pemenang akan diumumkan sesuai jadwal.",
      data: {
        nama: nama,
        whatsapp: whatsapp,
        alamat: alamat,
        kodeQuiz: kodeQuiz,
        kodeUnik: uniqueCode,
        timestamp: timestamp
      }
    });

  } catch (error) {
    Logger.log("Error doPost: " + error.toString());
    return jsonResponse({
      success: false,
      message: "Terjadi kesalahan server: " + error.message
    });
  }
}

/**
 * Menghandle request GET (Admin Data Fetch & Cek WA)
 */
function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : "";
    
    // Cek duplikasi nomor WA
    if (action === "checkWhatsapp") {
      let targetWa = (e.parameter.whatsapp || "").replace(/\D/g, "");
      if (targetWa.startsWith("0")) targetWa = "62" + targetWa.substring(1);
      else if (targetWa.startsWith("8")) targetWa = "62" + targetWa;

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse({ exists: false });
      }

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      let waCol = 4;
      for (let c = 0; c < headers.length; c++) {
        if (String(headers[c]).toLowerCase().includes("whatsapp")) {
          waCol = c + 1;
          break;
        }
      }

      const waList = sheet.getRange(2, waCol, lastRow - 1, 1)
        .getValues()
        .map(r => String(r[0]).replace(/\D/g, "").trim());

      return jsonResponse({ exists: waList.includes(targetWa) });
    }

    // Admin Fetch Daftar Peserta
    if (action === "getSubmissions") {
      const pwd = e.parameter.password || "";
      if (pwd !== CONFIG.ADMIN_PASSWORD) {
        return jsonResponse({ success: false, message: "Akses ditolak: Password admin salah." });
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse({ success: true, submissions: [] });
      }

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const headers = values[0].map(h => String(h).trim().toLowerCase());

      const submissions = [];
      for (let r = 1; r < values.length; r++) {
        const row = values[r];
        const item = { rowNumber: r + 1 };

        headers.forEach((h, colIdx) => {
          const val = row[colIdx];
          if (h.includes("timestamp")) item.timestamp = val;
          else if (h.includes("kode unik")) item.kodeUnik = val;
          else if (h.includes("nama")) item.nama = val;
          else if (h.includes("whatsapp")) item.whatsapp = String(val).replace(/'/g, "");
          else if (h.includes("alamat")) item.alamat = val;
          else if (h.includes("instagram")) item.instagram = val;
          else if (h.includes("quiz") || h.includes("kode")) item.kodeQuiz = val;
          else if (h.includes("status")) item.statusVerifikasi = val;
          else if (h.includes("unit kerja")) item.unitKerja = val;
          else if (h.includes("unit organisasi")) item.unitOrganisasi = val;
          else if (h.includes("nip")) item.nip = String(val).replace(/'/g, "");
          else if (h.includes("screenshot") || h.includes("bukti")) item.linkScreenshot = val;
        });

        // Fallbacks pintar jika kolom sempat bergeser
        if (!item.whatsapp && item.nip) {
          const cleanNip = String(item.nip).replace(/\D/g, '').replace(/^0+/, '');
          if (cleanNip.length >= 10 && cleanNip.length <= 15) {
            item.whatsapp = cleanNip.startsWith('8') ? '62' + cleanNip : cleanNip;
          }
        }
        if (!item.alamat) {
          if (item.unitKerja && item.unitKerja !== "Menunggu Verifikasi") item.alamat = item.unitKerja;
          else if (item.unitOrganisasi && item.unitOrganisasi !== "Alamat Pengiriman") item.alamat = item.unitOrganisasi;
        }
        if (!item.statusVerifikasi) {
          item.statusVerifikasi = "Menunggu Verifikasi";
        }
        if (!item.kodeQuiz) {
          item.kodeQuiz = "2134";
        }

        submissions.push(item);
      }

      submissions.reverse(); // Terbaru di atas

      return jsonResponse({
        success: true,
        submissions: submissions
      });
    }

    // Update Status Verifikasi oleh Admin
    if (action === "updateStatus") {
      const pwd = e.parameter.password || "";
      if (pwd !== CONFIG.ADMIN_PASSWORD) {
        return jsonResponse({ success: false, message: "Akses ditolak." });
      }

      const id = String(e.parameter.id || "").trim();
      const newStatus = (e.parameter.status || "").trim();

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse({ success: false, message: "Sheet kosong." });
      }

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const headers = values[0].map(h => String(h).trim().toLowerCase());

      let statusColIdx = -1;
      let kodeUnikColIdx = -1;

      for (let c = 0; c < headers.length; c++) {
        if (headers[c].includes("status")) statusColIdx = c + 1;
        if (headers[c].includes("kode unik")) kodeUnikColIdx = c + 1;
      }

      if (statusColIdx === -1) {
        return jsonResponse({ success: false, message: "Kolom status tidak ditemukan." });
      }

      let updated = false;
      for (let r = 1; r < values.length; r++) {
        const rowKode = kodeUnikColIdx !== -1 ? String(values[r][kodeUnikColIdx - 1]).trim() : "";
        const rowNum = String(r + 1);

        if (rowKode === id || rowNum === id) {
          sheet.getRange(r + 1, statusColIdx).setValue(newStatus);
          updated = true;
          break;
        }
      }

      return jsonResponse({ success: updated, message: updated ? "Status berhasil diperbarui" : "ID tidak ditemukan" });
    }

    return jsonResponse({ success: true, message: "Endpoint Detektif GRYA aktif." });

  } catch (error) {
    Logger.log("Error doGet: " + error.toString());
    return jsonResponse({ success: false, message: error.message });
  }
}

/**
 * Output JSON Response
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
