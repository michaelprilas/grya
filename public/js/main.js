/**
 * Detektif GRYA - Form Logic Kuis Majalah GRYA Edisi II
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('quizForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnSubmitText = document.getElementById('btnSubmitText');
  const btnSpinner = document.getElementById('btnSpinner');

  // Input Data Diri & Alamat
  const namaInput = document.getElementById('nama');
  const whatsappInput = document.getElementById('whatsapp');
  const alamatInput = document.getElementById('alamat');
  const whatsappDuplicateStatus = document.getElementById('whatsappDuplicateStatus');

  // Bukti Instagram
  const screenshotInput = document.getElementById('screenshot');
  const uploadDropzone = document.getElementById('uploadDropzone');
  const previewWrapper = document.getElementById('previewWrapper');
  const imagePreview = document.getElementById('imagePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const fileSizeDisplay = document.getElementById('fileSizeDisplay');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  const checkTagInput = document.getElementById('checkTag');
  const checkTagCard = document.getElementById('checkTagCard');
  const instagramInput = document.getElementById('instagram');

  // Kode Quiz
  const clueToggle = document.getElementById('clueToggle');
  const clueBody = document.getElementById('clueBody');
  const clueChevron = document.getElementById('clueChevron');
  const kodeQuizInput = document.getElementById('kodeQuiz');
  const quizCodeCard = document.getElementById('quizCodeCard');

  // Persetujuan
  const persetujuanInput = document.getElementById('persetujuan');
  const persetujuanCard = document.getElementById('persetujuanCard');

  // Success Modal Elements
  const successModal = document.getElementById('successModal');
  const receiptNama = document.getElementById('receiptNama');
  const receiptWhatsapp = document.getElementById('receiptWhatsapp');
  const receiptAlamat = document.getElementById('receiptAlamat');
  const receiptKodeQuiz = document.getElementById('receiptKodeQuiz');
  const receiptKodeUnik = document.getElementById('receiptKodeUnik');
  const btnCopyCode = document.getElementById('btnCopyCode');
  const btnShareWa = document.getElementById('btnShareWa');
  const btnCloseSuccess = document.getElementById('btnCloseSuccess');

  // Global Alert
  const globalAlert = document.getElementById('globalAlert');
  const globalAlertText = document.getElementById('globalAlertText');

  // File Upload State
  let selectedFile = null;
  let selectedFileBase64 = null;

  // 1. Poster Zoom Lightbox Modal
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

  // 2. Clue Accordion
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

  // 3. Interactive Checkbox Cards Visual Feedback
  function syncCheckboxCard(input, card) {
    if (input.checked) {
      card.classList.add('is-checked');
    } else {
      card.classList.remove('is-checked');
    }
  }

  if (checkTagInput && checkTagCard) {
    checkTagInput.addEventListener('change', () => {
      syncCheckboxCard(checkTagInput, checkTagCard);
      hideFieldError('checkTag');
    });
  }

  if (persetujuanInput && persetujuanCard) {
    persetujuanInput.addEventListener('change', () => {
      syncCheckboxCard(persetujuanInput, persetujuanCard);
      hideFieldError('persetujuan');
    });
  }

  // 4. WhatsApp Formatting & Duplication Check
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

  // 5. Instagram Username Formatting
  instagramInput.addEventListener('blur', (e) => {
    let val = e.target.value.trim().replace(/\s+/g, '');
    if (val && !val.startsWith('@')) {
      val = '@' + val;
    }
    e.target.value = val;
    if (val.length >= 2) hideFieldError('instagram');
  });

  // 6. Screenshot Upload & Automatic Client Compression
  uploadDropzone.addEventListener('click', () => screenshotInput.click());

  screenshotInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    hideFieldError('screenshot');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showFieldError('screenshot', 'Format file tidak didukung! Harap pilih foto JPG atau PNG.');
      return;
    }

    const maxSize = (window.APP_CONFIG && window.APP_CONFIG.MAX_FILE_SIZE_BYTES) || (5 * 1024 * 1024);
    if (file.size > maxSize) {
      showFieldError('screenshot', 'Ukuran foto terlalu besar! Maksimal ukuran adalah 5 MB.');
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    const sizeInKb = (file.size / 1024).toFixed(0);
    fileSizeDisplay.textContent = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : sizeInKb + ' KB';

    // Kompresi gambar client-side (Max 1200px, JPEG 0.75)
    compressImage(file).then((dataUrl) => {
      imagePreview.src = dataUrl;
      selectedFileBase64 = dataUrl;
      uploadDropzone.classList.add('hidden');
      previewWrapper.classList.remove('hidden');
      lucide.createIcons();
    }).catch((err) => {
      console.warn('Fallback kompresi gambar:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        selectedFileBase64 = e.target.result;
        uploadDropzone.classList.add('hidden');
        previewWrapper.classList.remove('hidden');
        lucide.createIcons();
      };
      reader.readAsDataURL(file);
    });
  }

  function compressImage(file, maxDimension = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

  // 7. Validasi Kode Quiz
  function validateQuizCode() {
    const rawCode = (kodeQuizInput.value || '').trim().toUpperCase().replace(/[\s-]/g, '');
    const validCodes = (window.APP_CONFIG && window.APP_CONFIG.VALID_QUIZ_CODES) || ['2134', '1423', '1234', 'GRYA2026'];
    const isValid = validCodes.some(c => c.toUpperCase().replace(/[\s-]/g, '') === rawCode);

    if (!rawCode || !isValid) {
      showFieldError('kodeQuiz', 'Kode belum tepat, coba periksa kembali jawabanmu');
      quizCodeCard.classList.remove('shake-it');
      void quizCodeCard.offsetWidth;
      quizCodeCard.classList.add('shake-it');
      kodeQuizInput.classList.add('error-border');
      return false;
    }

    hideFieldError('kodeQuiz');
    kodeQuizInput.classList.remove('error-border');
    kodeQuizInput.classList.add('success-border');
    return rawCode;
  }

  kodeQuizInput.addEventListener('input', () => {
    hideFieldError('kodeQuiz');
    kodeQuizInput.classList.remove('error-border');
  });

  // 8. Field Error Helpers
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

  // 9. Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideGlobalAlert();

    let hasError = false;

    // 1. Validasi Nama
    const namaVal = namaInput.value.trim();
    if (!namaVal || namaVal.length < 3) {
      showFieldError('nama', 'Nama Lengkap wajib diisi minimal 3 karakter.');
      hasError = true;
    } else {
      hideFieldError('nama');
    }

    // 2. Validasi WhatsApp
    const cleanWa = validateWhatsApp();
    if (!cleanWa) {
      hasError = true;
    }

    // 3. Validasi Alamat
    const alamatVal = alamatInput.value.trim();
    if (!alamatVal || alamatVal.length < 10) {
      showFieldError('alamat', 'Harap isi alamat pengiriman dengan lengkap (minimal 10 karakter).');
      hasError = true;
    } else {
      hideFieldError('alamat');
    }

    // 4. Validasi Bukti Screenshot
    if (!selectedFile) {
      showFieldError('screenshot', 'Screenshot Instagram Story wajib diunggah.');
      hasError = true;
    } else {
      hideFieldError('screenshot');
    }

    // 5. Validasi Checkbox Tag
    if (!checkTagInput.checked) {
      showFieldError('checkTag', 'Harap konfirmasi bahwa Anda sudah men-tag @kementerianpkp');
      hasError = true;
    } else {
      hideFieldError('checkTag');
    }

    // 6. Validasi Username Instagram
    const instagramVal = instagramInput.value.trim();
    if (!instagramVal || instagramVal.length < 2) {
      showFieldError('instagram', 'Username Instagram peserta wajib diisi.');
      hasError = true;
    } else {
      hideFieldError('instagram');
    }

    // 7. Validasi Kode Quiz
    const cleanQuizCode = validateQuizCode();
    if (!cleanQuizCode) {
      hasError = true;
    }

    // 8. Validasi Persetujuan
    if (!persetujuanInput.checked) {
      showFieldError('persetujuan', 'Anda wajib menyetujui ketentuan kuis untuk mengirim data.');
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
        screenshotBase64: selectedFileBase64,
        instagram: instagramVal,
        kodeQuiz: cleanQuizCode,
        persetujuan: true,
        // Fallback kompatibilitas dengan sheet lama:
        nip: ('000000' + cleanWa).slice(-18),
        unitOrganisasi: 'Alamat Pengiriman',
        unitKerja: alamatVal
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

        const formData = new FormData();
        formData.append('nama', namaVal);
        formData.append('whatsapp', cleanWa);
        formData.append('alamat', alamatVal);
        formData.append('alamatPengiriman', alamatVal);
        formData.append('instagram', instagramVal);
        formData.append('kodeQuiz', cleanQuizCode);
        formData.append('persetujuan', 'true');
        formData.append('screenshot', selectedFile);

        const response = await fetch('/api/submit', {
          method: 'POST',
          body: formData
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
        if (receiptKodeQuiz) receiptKodeQuiz.textContent = cleanQuizCode;
        receiptKodeUnik.textContent = uniqueCode;

        const timeEl = document.getElementById('receiptTime');
        if (timeEl) {
          timeEl.textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        // WhatsApp Share Link
        const shareMsg = `*TANDA TERIMA KUIS DETEKTIF GRYA*\nKementerian Perumahan dan Kawasan Permukiman\n\nNama: ${submittedNama}\nNomor WhatsApp: ${submittedWa}\nAlamat Pengiriman: ${submittedAlamat}\nKode Rahasia: ${cleanQuizCode}\nKode Bukti: *${uniqueCode}*\n\nSimpan pesan ini sebagai bukti keikutsertaan undian berhadiah Majalah GRYA Edisi II.`;
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
        checkTagCard.classList.remove('is-checked');
        persetujuanCard.classList.remove('is-checked');

      } else {
        const errMsg = resultData.message || 'Gagal mengirim data. Silakan coba beberapa saat lagi.';
        if (errMsg.includes('sudah pernah terkirim') || resultData.errorCode === 'DUPLICATE_WA' || resultData.errorCode === 'DUPLICATE_NIP') {
          showDuplicateWaWarning();
          showGlobalAlert('Nomor WhatsApp ini sudah pernah terdaftar untuk undian.', true);
        } else if (resultData.errorCode === 'INVALID_QUIZ_CODE') {
          showFieldError('kodeQuiz', 'Kode belum tepat, coba periksa kembali jawabanmu');
          quizCodeCard.classList.add('shake-it');
          kodeQuizInput.focus();
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

  // 10. Salin Kode Unik
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

  // 11. Tutup Modal Sukses
  btnCloseSuccess.addEventListener('click', () => {
    successModal.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
