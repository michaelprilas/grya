/**
 * Detektif GRYA - Mobile-Optimized Form Logic
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('quizForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnSubmitText = document.getElementById('btnSubmitText');
  const btnSpinner = document.getElementById('btnSpinner');

  const namaInput = document.getElementById('nama');
  const nipInput = document.getElementById('nip');
  const nipCounter = document.getElementById('nipCounter');
  const nipCounterBadge = document.getElementById('nipCounterBadge');
  const nipDuplicateStatus = document.getElementById('nipDuplicateStatus');
  const unitOrganisasiInput = document.getElementById('unitOrganisasi');
  const unitKerjaInput = document.getElementById('unitKerja');
  const whatsappInput = document.getElementById('whatsapp');
  const instagramInput = document.getElementById('instagram');
  const checkTagInput = document.getElementById('checkTag');
  const checkTagCard = document.getElementById('checkTagCard');
  const kodeQuizInput = document.getElementById('kodeQuiz');
  const quizCodeCard = document.getElementById('quizCodeCard');
  const persetujuanInput = document.getElementById('persetujuan');
  const persetujuanCard = document.getElementById('persetujuanCard');

  // File Upload Elements
  const screenshotInput = document.getElementById('screenshot');
  const uploadDropzone = document.getElementById('uploadDropzone');
  const previewWrapper = document.getElementById('previewWrapper');
  const imagePreview = document.getElementById('imagePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const fileSizeDisplay = document.getElementById('fileSizeDisplay');
  const btnRemoveImage = document.getElementById('btnRemoveImage');

  // Clue Accordion
  const clueToggle = document.getElementById('clueToggle');
  const clueBody = document.getElementById('clueBody');
  const clueChevron = document.getElementById('clueChevron');

  // Success Modal Elements
  const successModal = document.getElementById('successModal');
  const receiptNama = document.getElementById('receiptNama');
  const receiptNip = document.getElementById('receiptNip');
  const receiptKodeUnik = document.getElementById('receiptKodeUnik');
  const btnCopyCode = document.getElementById('btnCopyCode');
  const btnShareWa = document.getElementById('btnShareWa');
  const btnCloseSuccess = document.getElementById('btnCloseSuccess');

  // Global Alert
  const globalAlert = document.getElementById('globalAlert');
  const globalAlertText = document.getElementById('globalAlertText');

  // Steps
  const stepPills = [
    document.getElementById('stepPill1'),
    document.getElementById('stepPill2'),
    document.getElementById('stepPill3'),
    document.getElementById('stepPill4')
  ];

  let selectedFile = null;
  let selectedFileBase64 = null;

  // 1. Step Indicator Progress on Mobile Focus
  const sections = [
    { card: document.getElementById('cardSection1'), stepIndex: 0 },
    { card: document.getElementById('cardSection2'), stepIndex: 1 },
    { card: document.getElementById('quizCodeCard'), stepIndex: 2 },
    { card: document.getElementById('cardSection4'), stepIndex: 3 }
  ];

  sections.forEach(({ card, stepIndex }) => {
    if (card) {
      card.addEventListener('focusin', () => setActiveStep(stepIndex));
      card.addEventListener('click', () => setActiveStep(stepIndex));
    }
  });

  function setActiveStep(index) {
    stepPills.forEach((pill, i) => {
      if (!pill) return;
      if (i === index) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // 3. Accordion Clue Toggle
  if (clueToggle) {
    clueToggle.addEventListener('click', () => {
      const isHidden = clueBody.classList.contains('hidden');
      if (isHidden) {
        clueBody.classList.remove('hidden');
        clueChevron.style.transform = 'rotate(180deg)';
      } else {
        clueBody.classList.add('hidden');
        clueChevron.style.transform = 'rotate(0deg)';
      }
    });
  }

  // 3b. Poster Zoom Lightbox Modal
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

  // 4. Interactive Checkbox Cards Visual Feedback
  function syncCheckboxCard(input, card) {
    if (input.checked) {
      card.classList.add('is-checked');
    } else {
      card.classList.remove('is-checked');
    }
  }

  checkTagInput.addEventListener('change', () => {
    syncCheckboxCard(checkTagInput, checkTagCard);
    hideFieldError('checkTag');
  });

  persetujuanInput.addEventListener('change', () => {
    syncCheckboxCard(persetujuanInput, persetujuanCard);
    hideFieldError('persetujuan');
  });

  // 5. Realtime NIP Handling (18 Digits & Counter Badge)
  nipInput.addEventListener('input', async (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 18) val = val.substring(0, 18);
    e.target.value = val;
    nipCounter.textContent = val.length;

    hideFieldError('nip');
    nipDuplicateStatus.classList.add('hidden');

    if (val.length === 18) {
      nipCounterBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-300 transition-colors flex items-center gap-1';
      nipCounterBadge.innerHTML = `<i data-lucide="check" class="w-2.5 h-2.5"></i> 18 / 18 digit`;
      lucide.createIcons();

      // Cek localStorage dulu
      if (localStorage.getItem(`grya_submitted_${val}`)) {
        showDuplicateNipWarning();
        return;
      }

      // Cek ke backend
      try {
        const res = await fetch(`/api/check-nip/${val}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            showDuplicateNipWarning();
          }
        }
      } catch (err) {
        // Mode offline / direct apps script
      }
    } else {
      nipCounterBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 transition-colors';
      nipCounterBadge.innerHTML = `<span id="nipCounter">${val.length}</span> / 18`;
    }
  });

  function showDuplicateNipWarning() {
    nipDuplicateStatus.textContent = 'Data dengan NIP ini sudah pernah terkirim.';
    nipDuplicateStatus.classList.remove('hidden');
    nipInput.classList.add('error-border');
  }

  // 6. Realtime WhatsApp Normalization (08xxx -> 628xxx)
  whatsappInput.addEventListener('blur', (e) => {
    let val = e.target.value.trim().replace(/\D/g, '');
    if (val.startsWith('0')) {
      val = '62' + val.substring(1);
    } else if (val.startsWith('8')) {
      val = '62' + val;
    }
    if (val) {
      e.target.value = val;
    }
    validateWhatsApp();
  });

  // 7. Realtime Instagram Username Formatting
  instagramInput.addEventListener('blur', (e) => {
    let val = e.target.value.trim().replace(/\s+/g, '');
    if (val && !val.startsWith('@')) {
      val = '@' + val;
    }
    e.target.value = val;
    if (val.length >= 2) hideFieldError('instagram');
  });

  // 8. Screenshot Upload & Preview
  uploadDropzone.addEventListener('click', () => screenshotInput.click());

  screenshotInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    hideFieldError('screenshot');

    // Validasi Format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showFieldError('screenshot', 'Format file tidak didukung! Harap pilih foto JPG atau PNG.');
      return;
    }

    // Validasi Ukuran (Max 5 MB)
    const maxSize = (window.APP_CONFIG && window.APP_CONFIG.MAX_FILE_SIZE_BYTES) || (5 * 1024 * 1024);
    if (file.size > maxSize) {
      showFieldError('screenshot', 'Ukuran foto terlalu besar! Maksimal ukuran adalah 5 MB.');
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    
    // Format ukuran berkas (e.g. 1.2 MB atau 800 KB)
    const sizeInKb = (file.size / 1024).toFixed(0);
    const sizeFormatted = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : sizeInKb + ' KB';
    fileSizeDisplay.textContent = sizeFormatted;

    // Baca ke FileReader untuk preview & base64
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      selectedFileBase64 = e.target.result;
      uploadDropzone.classList.add('hidden');
      previewWrapper.classList.remove('hidden');
      lucide.createIcons();
    };
    reader.readAsDataURL(file);
  }

  btnRemoveImage.addEventListener('click', () => {
    selectedFile = null;
    selectedFileBase64 = null;
    screenshotInput.value = '';
    imagePreview.src = '';
    fileNameDisplay.textContent = '';
    fileSizeDisplay.textContent = '';
    previewWrapper.classList.add('hidden');
    uploadDropzone.classList.remove('hidden');
  });

  // 9. Validasi Kode Quiz
  function validateQuizCode() {
    const rawCode = (kodeQuizInput.value || '').trim().toUpperCase().replace(/[\s-]/g, '');
    const validCodes = (window.APP_CONFIG && window.APP_CONFIG.VALID_QUIZ_CODES) || ['2134', '1423', '1234', 'GRYA2026'];

    const isValid = validCodes.some(c => c.toUpperCase().replace(/[\s-]/g, '') === rawCode);

    if (!rawCode || !isValid) {
      showFieldError('kodeQuiz', 'Kode belum tepat, coba periksa kembali jawabanmu');
      quizCodeCard.classList.remove('shake-it');
      void quizCodeCard.offsetWidth; // trigger reflow
      quizCodeCard.classList.add('shake-it');
      kodeQuizInput.classList.add('error-border');
      return false;
    }

    hideFieldError('kodeQuiz');
    kodeQuizInput.classList.remove('error-border');
    kodeQuizInput.classList.add('success-border');
    return true;
  }

  kodeQuizInput.addEventListener('input', () => {
    hideFieldError('kodeQuiz');
    kodeQuizInput.classList.remove('error-border');
  });

  // 10. Field Validation Helpers
  function showFieldError(fieldId, message) {
    const errEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.remove('hidden');
    }
    if (inputEl && inputEl.classList) {
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
    if (inputEl && inputEl.classList) {
      inputEl.classList.remove('error-border');
    }
  }

  function validateWhatsApp() {
    let cleanWa = whatsappInput.value.replace(/\D/g, '');
    if (cleanWa.length < 10 || cleanWa.length > 15) {
      showFieldError('whatsapp', 'Nomor WhatsApp minimal 10 digit dan maksimal 15 digit.');
      return false;
    }
    hideFieldError('whatsapp');
    return true;
  }

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

  // 11. Form Submission Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideGlobalAlert();

    let hasError = false;

    // Validasi Nama
    if (!namaInput.value || namaInput.value.trim().length < 3) {
      showFieldError('nama', 'Nama Lengkap wajib diisi minimal 3 karakter.');
      hasError = true;
    } else {
      hideFieldError('nama');
    }

    // Validasi NIP
    const cleanNip = nipInput.value.replace(/\D/g, '');
    if (!cleanNip || cleanNip.length !== 18) {
      showFieldError('nip', 'NIP harus berupa 18 digit angka.');
      hasError = true;
    } else {
      hideFieldError('nip');
    }

    // Validasi Unit Organisasi
    if (!unitOrganisasiInput.value || !unitOrganisasiInput.value.trim()) {
      showFieldError('unitOrganisasi', 'Unit Organisasi wajib dipilih atau diisi.');
      hasError = true;
    } else {
      hideFieldError('unitOrganisasi');
    }

    // Validasi Unit Kerja
    if (!unitKerjaInput.value || !unitKerjaInput.value.trim()) {
      showFieldError('unitKerja', 'Unit Kerja wajib diisi.');
      hasError = true;
    } else {
      hideFieldError('unitKerja');
    }

    // Validasi WhatsApp
    if (!validateWhatsApp()) {
      hasError = true;
    }

    // Validasi File Screenshot
    if (!selectedFile) {
      showFieldError('screenshot', 'Screenshot Instagram Story wajib dipilih.');
      hasError = true;
    } else {
      hideFieldError('screenshot');
    }

    // Validasi Checkbox Tag
    if (!checkTagInput.checked) {
      showFieldError('checkTag', 'Harap konfirmasi bahwa Anda sudah men-tag @kementerianpkp');
      hasError = true;
    } else {
      hideFieldError('checkTag');
    }

    // Validasi Instagram Username
    if (!instagramInput.value || instagramInput.value.trim().length < 2) {
      showFieldError('instagram', 'Username Instagram peserta wajib diisi.');
      hasError = true;
    } else {
      hideFieldError('instagram');
    }

    // Validasi Kode Quiz
    if (!validateQuizCode()) {
      hasError = true;
    }

    // Validasi Persetujuan
    if (!persetujuanInput.checked) {
      showFieldError('persetujuan', 'Anda wajib menyetujui ketentuan kuis untuk dapat mengirim data.');
      hasError = true;
    } else {
      hideFieldError('persetujuan');
    }

    if (hasError) {
      const firstError = document.querySelector('.error-border, .text-red-600:not(.hidden)');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Cek Duplikasi NIP Lokal
    if (localStorage.getItem(`grya_submitted_${cleanNip}`)) {
      showDuplicateNipWarning();
      showGlobalAlert('Data dengan NIP ini sudah pernah terkirim. Satu NIP hanya boleh mengisi form satu kali.', true);
      return;
    }

    // MULAI PENGIRIMAN
    setSubmittingState(true);

    try {
      const appsScriptUrl = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_APPS_SCRIPT_URL;

      let resultData;

      if (appsScriptUrl && appsScriptUrl.trim().length > 10) {
        // ========================================================
        // MODE A: KIRIM LANGSUNG KE GOOGLE APPS SCRIPT / SHEETS
        // ========================================================
        const payload = {
          nama: namaInput.value.trim(),
          nip: cleanNip,
          unitOrganisasi: unitOrganisasiInput.value.trim(),
          unitKerja: unitKerjaInput.value.trim(),
          whatsapp: whatsappInput.value.trim(),
          instagram: instagramInput.value.trim(),
          kodeQuiz: kodeQuizInput.value.trim().toUpperCase().replace(/[\s-]/g, ''),
          persetujuan: true,
          screenshotBase64: selectedFileBase64
        };

        // Menggunakan text/plain agar tidak memicu CORS Preflight OPTIONS di Apps Script
        const response = await fetch(appsScriptUrl, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        resultData = await response.json();

      } else {
        // ========================================================
        // MODE B: KIRIM KE LOCAL NODE.JS BACKEND (/api/submit)
        // ========================================================
        if (window.location.hostname.includes('github.io')) {
          showGlobalAlert('Backend Google Apps Script belum diisi di js/config.js. Hubungkan URL Web App agar data kuis tersimpan di Google Sheets.', true);
          return;
        }

        const formData = new FormData();
        formData.append('nama', namaInput.value.trim());
        formData.append('nip', cleanNip);
        formData.append('unitOrganisasi', unitOrganisasiInput.value.trim());
        formData.append('unitKerja', unitKerjaInput.value.trim());
        formData.append('whatsapp', whatsappInput.value.trim());
        formData.append('instagram', instagramInput.value.trim());
        formData.append('kodeQuiz', kodeQuizInput.value.trim().toUpperCase().replace(/[\s-]/g, ''));
        formData.append('persetujuan', 'true');
        formData.append('screenshot', selectedFile);

        const response = await fetch('/api/submit', {
          method: 'POST',
          body: formData
        });

        resultData = await response.json();
      }

      if (resultData && resultData.success) {
        localStorage.setItem(`grya_submitted_${cleanNip}`, 'true');

        const submittedNama = resultData.data.nama || namaInput.value;
        const submittedNip = resultData.data.nip || cleanNip;
        const uniqueCode = resultData.data.kodeUnik || 'GRYA-' + Math.floor(1000 + Math.random() * 9000);

        receiptNama.textContent = submittedNama;
        receiptNip.textContent = submittedNip;
        receiptKodeUnik.textContent = uniqueCode;

        const timeEl = document.getElementById('receiptTime');
        if (timeEl) {
          timeEl.textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        // WhatsApp Share Link
        const shareMsg = `*TANDA TERIMA KUIS DETEKTIF GRYA*\nKementerian Perumahan dan Kawasan Permukiman\n\nNama: ${submittedNama}\nNIP: ${submittedNip}\nKode Bukti: *${uniqueCode}*\n\nSimpan pesan ini sebagai bukti keikutsertaan undian kuis.`;
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
        selectedFile = null;
        selectedFileBase64 = null;
        previewWrapper.classList.add('hidden');
        uploadDropzone.classList.remove('hidden');
        nipCounter.textContent = '0';
        nipCounterBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 transition-colors';
        nipCounterBadge.innerHTML = `<span id="nipCounter">0</span> / 18`;
        checkTagCard.classList.remove('is-checked');
        persetujuanCard.classList.remove('is-checked');

      } else {
        const errMsg = resultData.message || 'Gagal mengirim data. Silakan coba beberapa saat lagi.';
        
        if (resultData.errorCode === 'INVALID_QUIZ_CODE') {
          showFieldError('kodeQuiz', 'Kode belum tepat, coba periksa kembali jawabanmu');
          quizCodeCard.classList.add('shake-it');
          kodeQuizInput.focus();
        } else if (resultData.errorCode === 'DUPLICATE_NIP' || errMsg.includes('sudah pernah terkirim')) {
          showDuplicateNipWarning();
          showGlobalAlert('Data dengan NIP ini sudah pernah terkirim.', true);
        } else {
          showGlobalAlert(errMsg, true);
        }
      }

    } catch (error) {
      console.error('Submission error:', error);
      showGlobalAlert('Terjadi gangguan koneksi saat mengirim jawaban. Pastikan internet Anda aktif dan coba lagi.', true);
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

  // 12. Salin Kode Unik
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

  // 13. Tutup Modal Sukses
  btnCloseSuccess.addEventListener('click', () => {
    successModal.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
