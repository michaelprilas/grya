/**
 * Detektif GRYA - Form Undian Hadiah
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 * Formulir: Nama, Nomor Whatsapp, Alamat Pengiriman Hadiah
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('quizForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnSubmitText = document.getElementById('btnSubmitText');
  const btnSpinner = document.getElementById('btnSpinner');

  const namaInput = document.getElementById('nama');
  const whatsappInput = document.getElementById('whatsapp');
  const alamatInput = document.getElementById('alamat');
  const whatsappDuplicateStatus = document.getElementById('whatsappDuplicateStatus');

  // Success Modal Elements
  const successModal = document.getElementById('successModal');
  const receiptNama = document.getElementById('receiptNama');
  const receiptWhatsapp = document.getElementById('receiptWhatsapp');
  const receiptAlamat = document.getElementById('receiptAlamat');
  const receiptKodeUnik = document.getElementById('receiptKodeUnik');
  const btnCopyCode = document.getElementById('btnCopyCode');
  const btnShareWa = document.getElementById('btnShareWa');
  const btnCloseSuccess = document.getElementById('btnCloseSuccess');

  // Global Alert
  const globalAlert = document.getElementById('globalAlert');
  const globalAlertText = document.getElementById('globalAlertText');

  // Poster Zoom Lightbox Modal
  const btnZoomPoster = document.getElementById('btnZoomPoster');
  const posterModal = document.getElementById('posterModal');
  const btnClosePosterModal = document.getElementById('btnClosePosterModal');
  const btnDismissPosterModal = document.getElementById('btnDismissPosterModal');

  if (btnZoomPoster && posterModal) {
    btnZoomPoster.addEventListener('click', () => {
      posterModal.classList.remove('hidden');
      lucide.createIcons();
    });

    const closePoster = () => posterModal.classList.add('hidden');
    if (btnClosePosterModal) btnClosePosterModal.addEventListener('click', closePoster);
    if (btnDismissPosterModal) btnDismissPosterModal.addEventListener('click', closePoster);
    posterModal.addEventListener('click', (e) => {
      if (e.target === posterModal) closePoster();
    });
  }

  // 1. WhatsApp Formatting & Duplication Check
  function getCleanWhatsApp(val) {
    let clean = (val || '').trim().replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return clean;
  }

  function validateWhatsApp() {
    const rawVal = whatsappInput.value.trim();
    if (!rawVal) {
      showFieldError('whatsapp', 'Nomor WhatsApp wajib diisi.');
      return false;
    }

    const cleanWa = getCleanWhatsApp(rawVal);
    if (cleanWa.length < 10 || cleanWa.length > 15) {
      showFieldError('whatsapp', 'Nomor WhatsApp minimal 10 digit dan maksimal 15 digit.');
      return false;
    }

    hideFieldError('whatsapp');
    return cleanWa;
  }

  whatsappInput.addEventListener('blur', () => {
    const cleanWa = validateWhatsApp();
    if (cleanWa) {
      // Simpan format rapi di input
      whatsappInput.value = cleanWa;
      checkLocalDuplicate(cleanWa);
    }
  });

  whatsappInput.addEventListener('input', () => {
    hideFieldError('whatsapp');
    whatsappDuplicateStatus.classList.add('hidden');
  });

  function checkLocalDuplicate(cleanWa) {
    if (localStorage.getItem(`grya_submitted_${cleanWa}`)) {
      showDuplicateWaWarning();
      return true;
    }
    return false;
  }

  function showDuplicateWaWarning() {
    whatsappDuplicateStatus.textContent = 'Nomor WhatsApp ini sudah pernah terdaftar untuk undian.';
    whatsappDuplicateStatus.classList.remove('hidden');
    whatsappInput.classList.add('error-border');
  }

  // 2. Field Error Helpers
  function showFieldError(fieldId, message) {
    const errEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.remove('hidden');
    }
    if (inputEl) {
      inputEl.classList.add('error-border');
    }
  }

  function hideFieldError(fieldId) {
    const errEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (errEl) {
      errEl.classList.add('hidden');
      errEl.textContent = '';
    }
    if (inputEl) {
      inputEl.classList.remove('error-border');
    }
  }

  namaInput.addEventListener('input', () => hideFieldError('nama'));
  alamatInput.addEventListener('input', () => hideFieldError('alamat'));

  function showGlobalAlert(message, isError = true) {
    globalAlertText.textContent = message;
    globalAlert.className = isError
      ? 'mb-3.5 p-3.5 rounded-xl text-xs sm:text-sm font-semibold border flex items-start space-x-2.5 bg-red-50 border-red-200 text-red-800'
      : 'mb-3.5 p-3.5 rounded-xl text-xs sm:text-sm font-semibold border flex items-start space-x-2.5 bg-green-50 border-green-200 text-green-800';
    globalAlert.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideGlobalAlert() {
    globalAlert.classList.add('hidden');
  }

  // 3. Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideGlobalAlert();

    let hasError = false;

    // Validasi 1: Nama
    const namaVal = namaInput.value.trim();
    if (!namaVal || namaVal.length < 3) {
      showFieldError('nama', 'Nama Lengkap wajib diisi minimal 3 karakter.');
      hasError = true;
    } else {
      hideFieldError('nama');
    }

    // Validasi 2: WhatsApp
    const cleanWa = validateWhatsApp();
    if (!cleanWa) {
      hasError = true;
    }

    // Validasi 3: Alamat Pengiriman
    const alamatVal = alamatInput.value.trim();
    if (!alamatVal || alamatVal.length < 10) {
      showFieldError('alamat', 'Harap isi alamat pengiriman dengan lengkap (minimal 10 karakter).');
      hasError = true;
    } else {
      hideFieldError('alamat');
    }

    if (hasError) {
      const firstError = document.querySelector('.error-border, .text-red-600:not(.hidden)');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Cek Duplikasi WhatsApp di browser lokal
    if (checkLocalDuplicate(cleanWa)) {
      showGlobalAlert('Nomor WhatsApp ini sudah pernah terdaftar untuk undian. Satu nomor hanya boleh mendaftar satu kali.', true);
      return;
    }

    setSubmittingState(true);

    try {
      const appsScriptUrl = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_APPS_SCRIPT_URL;
      let resultData;

      const payload = {
        nama: namaVal,
        whatsapp: cleanWa,
        alamat: alamatVal,
        alamatPengiriman: alamatVal,
        // Kompatibilitas mundur dengan script/spreadsheet sebelumnya:
        nip: ('000000' + cleanWa).slice(-18),
        unitOrganisasi: 'Alamat Pengiriman',
        unitKerja: alamatVal,
        instagram: '-',
        kodeQuiz: '2134',
        persetujuan: true
      };

      if (appsScriptUrl && appsScriptUrl.trim().length > 10) {
        // ========================================================
        // MODE A: GOOGLE APPS SCRIPT
        // ========================================================
        const response = await fetch(appsScriptUrl, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        resultData = await response.json();

      } else {
        // ========================================================
        // MODE B: LOCAL NODE.JS BACKEND (/api/submit)
        // ========================================================
        if (window.location.hostname.includes('github.io')) {
          showGlobalAlert('Konfigurasi backend Google Apps Script belum terhubung di js/config.js.', true);
          return;
        }

        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resultData = await response.json();
      }

      if (resultData && resultData.success) {
        // Simpan catatan submission di browser
        localStorage.setItem(`grya_submitted_${cleanWa}`, 'true');

        const submittedNama = (resultData.data && resultData.data.nama) || namaVal;
        const submittedWa = (resultData.data && resultData.data.whatsapp) || cleanWa;
        const submittedAlamat = (resultData.data && (resultData.data.alamat || resultData.data.alamatPengiriman)) || alamatVal;
        const uniqueCode = (resultData.data && resultData.data.kodeUnik) || 'GRYA-' + Math.floor(1000 + Math.random() * 9000);

        receiptNama.textContent = submittedNama;
        receiptWhatsapp.textContent = submittedWa;
        receiptAlamat.textContent = submittedAlamat;
        receiptKodeUnik.textContent = uniqueCode;

        const timeEl = document.getElementById('receiptTime');
        if (timeEl) {
          timeEl.textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        // WhatsApp Share Link
        const shareMsg = `*TANDA TERIMA UNDIAN KUIS DETEKTIF GRYA*\nKementerian Perumahan dan Kawasan Permukiman\n\nNama: ${submittedNama}\nNomor WhatsApp: ${submittedWa}\nAlamat Pengiriman: ${submittedAlamat}\nKode Bukti: *${uniqueCode}*\n\nSimpan pesan ini sebagai bukti keikutsertaan undian berhadiah Majalah GRYA Edisi II.`;
        btnShareWa.href = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;

        // Festive Confetti Blast
        if (window.confetti) {
          confetti({
            particleCount: 140,
            spread: 80,
            origin: { y: 0.6 }
          });
        }

        successModal.classList.remove('hidden');
        lucide.createIcons();

        // Reset form
        form.reset();

      } else {
        const errMsg = resultData.message || 'Gagal mengirim data. Silakan coba beberapa saat lagi.';
        if (errMsg.includes('sudah pernah terkirim') || resultData.errorCode === 'DUPLICATE_WA' || resultData.errorCode === 'DUPLICATE_NIP') {
          showDuplicateWaWarning();
          showGlobalAlert('Nomor WhatsApp ini sudah pernah terdaftar untuk undian.', true);
        } else {
          showGlobalAlert(errMsg, true);
        }
      }

    } catch (error) {
      console.error('Submission error:', error);
      const errDetail = error && error.message ? ` (${error.message})` : '';
      showGlobalAlert('Gagal mengirim data' + errDetail + '. Pastikan internet aktif dan coba lagi.', true);
    } finally {
      setSubmittingState(false);
    }
  });

  function setSubmittingState(isSubmitting) {
    btnSubmit.disabled = isSubmitting;
    if (isSubmitting) {
      btnSubmitText.classList.add('opacity-0');
      btnSpinner.classList.remove('hidden');
    } else {
      btnSubmitText.classList.remove('opacity-0');
      btnSpinner.classList.add('hidden');
    }
  }

  // 4. Salin Kode Unik
  btnCopyCode.addEventListener('click', () => {
    const code = receiptKodeUnik.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        btnCopyCode.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-green-600"></i> Tersalin!`;
        lucide.createIcons();
        setTimeout(() => {
          btnCopyCode.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin`;
          lucide.createIcons();
        }, 2500);
      });
    } else {
      alert(`Kode Bukti Anda: ${code}`);
    }
  });

  // 5. Tutup Modal Sukses
  btnCloseSuccess.addEventListener('click', () => {
    successModal.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
