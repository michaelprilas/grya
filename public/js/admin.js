/**
 * Detektif GRYA - Admin Dashboard Logic (Mobile-Optimized)
 * Kementerian Perumahan dan Kawasan Permukiman (PKP)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginForm = document.getElementById('loginForm');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const loginError = document.getElementById('loginError');
  const btnLogout = document.getElementById('btnLogout');

  // Stats
  const statTotal = document.getElementById('statTotal');
  const statVerified = document.getElementById('statVerified');
  const statPending = document.getElementById('statPending');
  const statRejected = document.getElementById('statRejected');

  // Controls
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const statusTabPills = document.querySelectorAll('.filter-tab-pill');

  // Containers
  const mobileCardsContainer = document.getElementById('mobileCardsContainer');
  const submissionsTableBody = document.getElementById('submissionsTableBody');
  const emptyTableMessage = document.getElementById('emptyTableMessage');

  // Modals
  const drawModal = document.getElementById('drawModal');
  const btnOpenDrawModal = document.getElementById('btnOpenDrawModal');
  const btnCloseDrawModal = document.getElementById('btnCloseDrawModal');
  const btnStartDraw = document.getElementById('btnStartDraw');
  const rollingContainer = document.getElementById('rollingContainer');
  const rollingPlaceholder = document.getElementById('rollingPlaceholder');
  const rollingAnimation = document.getElementById('rollingAnimation');
  const rollingName = document.getElementById('rollingName');
  const rollingWa = document.getElementById('rollingWa');
  const winnerCard = document.getElementById('winnerCard');
  const poolCountText = document.getElementById('poolCountText');

  const imageModal = document.getElementById('imageModal');
  const imageModalSrc = document.getElementById('imageModalSrc');
  const imageModalTitle = document.getElementById('imageModalTitle');
  const imageModalDirectLink = document.getElementById('imageModalDirectLink');
  const btnCloseImageModal = document.getElementById('btnCloseImageModal');

  const configModal = document.getElementById('configModal');
  const btnOpenConfigModal = document.getElementById('btnOpenConfigModal');
  const btnCloseConfigModal = document.getElementById('btnCloseConfigModal');
  const configForm = document.getElementById('configForm');
  const newQuizCodeInput = document.getElementById('newQuizCodeInput');

  let currentSubmissions = [];
  let selectedStatus = 'Semua';
  let adminPassword = sessionStorage.getItem('grya_admin_pwd') || '';
  const urlParams = new URLSearchParams(window.location.search);
  const urlPwd = urlParams.get('pwd') || urlParams.get('password');
  if (urlPwd) {
    adminPassword = urlPwd;
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  // 1. Inisialisasi Auth
  const btnTogglePwd = document.getElementById('btnTogglePwd');
  if (btnTogglePwd) {
    btnTogglePwd.addEventListener('click', () => {
      const isPwd = adminPasswordInput.type === 'password';
      adminPasswordInput.type = isPwd ? 'text' : 'password';
      btnTogglePwd.innerHTML = isPwd ? '<i data-lucide="eye-off" class="w-4 h-4"></i>' : '<i data-lucide="eye" class="w-4 h-4"></i>';
      lucide.createIcons();
    });
  }

  if (adminPassword) {
    authenticate(adminPassword, false);
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = adminPasswordInput.value.trim();
    authenticate(pwd, true);
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('grya_admin_pwd');
    adminPassword = '';
    dashboardSection.classList.add('hidden');
    btnLogout.classList.add('hidden');
    loginSection.classList.remove('hidden');
    adminPasswordInput.value = '';
    loginError.classList.add('hidden');
  });

  function getAdminApiUrl(pwd) {
    const appsScriptUrl = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_APPS_SCRIPT_URL;
    if (appsScriptUrl && appsScriptUrl.trim().length > 10 && (window.location.hostname.includes('github.io') || !window.location.port || window.location.protocol === 'file:')) {
      return `${appsScriptUrl}?action=getSubmissions&password=${encodeURIComponent(pwd)}`;
    }
    return `/api/admin/submissions?password=${encodeURIComponent(pwd)}`;
  }

  async function authenticate(pwd, showError) {
    try {
      const url = getAdminApiUrl(pwd);
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success !== false) {
        adminPassword = pwd;
        sessionStorage.setItem('grya_admin_pwd', pwd);

        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
        loginError.classList.add('hidden');

        renderDashboard(data);
      } else {
        if (showError) {
          loginError.textContent = data.message || 'Password admin salah. Silakan coba kembali.';
          loginError.classList.remove('hidden');
        }
      }
    } catch (err) {
      if (showError) {
        loginError.textContent = 'Gagal menghubungi server: ' + err.message;
        loginError.classList.remove('hidden');
      }
    }
  }

  // ==========================================
  // SMART FIELD EXTRACTORS (Resilien & Lengkap)
  // ==========================================
  function getItemWhatsApp(item) {
    if (item.whatsapp && String(item.whatsapp).trim().length > 0) {
      return String(item.whatsapp).trim();
    }
    // Jika nomor WA masuk ke kolom NIP (kasus baris transisi)
    if (item.nip && String(item.nip).trim().length > 0) {
      let clean = String(item.nip).replace(/\D/g, '');
      clean = clean.replace(/^0+/, ''); // Buang leading zeros (e.g. 000000628...)
      if (clean.startsWith('8')) clean = '62' + clean;
      if (clean.length >= 10 && clean.length <= 15) return clean;
    }
    return item.whatsapp || '-';
  }

  function getItemAlamat(item) {
    if (item.alamat && item.alamat.trim()) return item.alamat.trim();
    if (item.alamatPengiriman && item.alamatPengiriman.trim()) return item.alamatPengiriman.trim();
    if (item.unitKerja && item.unitOrganisasi === 'Alamat Pengiriman') return item.unitKerja.trim();
    if (item.unitKerja && item.unitKerja.trim() && item.unitKerja !== 'Menunggu Verifikasi') return item.unitKerja.trim();
    if (item.unitOrganisasi && item.unitOrganisasi.trim() && item.unitOrganisasi !== 'Alamat Pengiriman') return item.unitOrganisasi.trim();
    return '-';
  }

  function getItemKodeQuiz(item) {
    if (item.kodeQuiz && String(item.kodeQuiz).trim().length > 0) return String(item.kodeQuiz).trim();
    if (item.kode && String(item.kode).trim().length > 0) return String(item.kode).trim();
    return '2134';
  }

  function getItemScreenshot(item) {
    const src = item.screenshotUrl || item.linkScreenshot || item.screenshot || '';
    if (!src || src === '-' || src.trim() === '') return '';
    return src.trim();
  }

  function getItemStatus(item) {
    const id = item.kodeUnik || item.id || String(item.rowNumber);
    const saved = localStorage.getItem('grya_admin_status_' + id);
    if (saved) return saved;
    return item.statusVerifikasi || 'Menunggu Verifikasi';
  }

  // 2. Fetch & Render Data
  function renderDashboard(data) {
    const rawList = data.submissions || [];
    currentSubmissions = rawList.map(item => {
      item.statusVerifikasi = getItemStatus(item);
      item.whatsapp = getItemWhatsApp(item);
      item.alamat = getItemAlamat(item);
      item.kodeQuiz = getItemKodeQuiz(item);
      item.screenshotUrl = getItemScreenshot(item);
      return item;
    });
    
    // Update Stats Counts
    const total = currentSubmissions.length;
    const verified = currentSubmissions.filter(s => s.statusVerifikasi === 'Terverifikasi').length;
    const pending = currentSubmissions.filter(s => s.statusVerifikasi === 'Menunggu Verifikasi').length;
    const rejected = currentSubmissions.filter(s => s.statusVerifikasi === 'Ditolak').length;

    statTotal.textContent = total;
    statVerified.textContent = verified;
    statPending.textContent = pending;
    statRejected.textContent = rejected;

    // Update Filter Tab Badges
    statusTabPills.forEach(pill => {
      const st = pill.getAttribute('data-status');
      if (st === 'Semua') pill.textContent = `Semua (${total})`;
      else if (st === 'Terverifikasi') pill.textContent = `Terverifikasi (${verified})`;
      else if (st === 'Menunggu Verifikasi') pill.textContent = `Menunggu (${pending})`;
      else if (st === 'Ditolak') pill.textContent = `Ditolak (${rejected})`;
    });

    applyFilterAndRender();
  }

  // 3. Status Tabs Filtering
  statusTabPills.forEach(pill => {
    pill.addEventListener('click', () => {
      statusTabPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedStatus = pill.getAttribute('data-status');
      applyFilterAndRender();
    });
  });

  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim().length > 0) {
      btnClearSearch.classList.remove('hidden');
    } else {
      btnClearSearch.classList.add('hidden');
    }
    applyFilterAndRender();
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    applyFilterAndRender();
  });

  // 4. Filter & Render
  function applyFilterAndRender() {
    const query = searchInput.value.toLowerCase().trim();

    let filtered = currentSubmissions.filter(item => {
      const matchStatus = (selectedStatus === 'Semua') || (item.statusVerifikasi === selectedStatus);
      const alamatText = getItemAlamat(item).toLowerCase();
      const waText = getItemWhatsApp(item).toLowerCase();
      const quizText = getItemKodeQuiz(item).toLowerCase();
      const matchQuery = !query || 
        (item.nama && item.nama.toLowerCase().includes(query)) ||
        waText.includes(query) ||
        (item.kodeUnik && item.kodeUnik.toLowerCase().includes(query)) ||
        quizText.includes(query) ||
        (item.instagram && item.instagram.toLowerCase().includes(query)) ||
        alamatText.includes(query);

      return matchStatus && matchQuery;
    });

    if (filtered.length === 0) {
      emptyTableMessage.classList.remove('hidden');
      mobileCardsContainer.innerHTML = '';
      submissionsTableBody.innerHTML = '';
      return;
    }
    emptyTableMessage.classList.add('hidden');

    renderMobileCards(filtered);
    renderDesktopTable(filtered);
    lucide.createIcons();
    attachActionListeners();
  }

  // ==========================================
  // RENDER MOBILE CARDS
  // ==========================================
  function renderMobileCards(list) {
    mobileCardsContainer.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'participant-mobile-card space-y-3';

      let statusPill = '';
      if (item.statusVerifikasi === 'Terverifikasi') {
        statusPill = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800"><i data-lucide="check-circle-2" class="w-3 h-3"></i> Terverifikasi</span>';
      } else if (item.statusVerifikasi === 'Ditolak') {
        statusPill = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800"><i data-lucide="x-circle" class="w-3 h-3"></i> Ditolak</span>';
      } else {
        statusPill = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"><i data-lucide="clock" class="w-3 h-3"></i> Menunggu</span>';
      }

      const waDisplay = getItemWhatsApp(item);
      const waNumber = waDisplay.replace(/\D/g, '');
      const waUrl = waNumber ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.nama)},%20kami%20dari%20Kementerian%20Perumahan%20dan%20Kawasan%20Permukiman%20(PKP)%20terkait%20undian%20Majalah%20GRYA...` : '#';
      const alamat = getItemAlamat(item);
      const kodeQuiz = getItemKodeQuiz(item);
      const photoSrc = getItemScreenshot(item);

      card.innerHTML = `
        <!-- Card Header: Kode & Status -->
        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
          <div class="flex items-center space-x-1.5">
            <span class="text-xs font-mono font-extrabold text-pkp-terracotta bg-pkp-terracotta-light px-2 py-0.5 rounded-lg border border-pkp-terracotta/20">
              ${escapeHtml(item.kodeUnik || '-')}
            </span>
            <span class="text-[10px] text-gray-400 font-medium">${escapeHtml(item.timestamp || '-')}</span>
          </div>
          <div>${statusPill}</div>
        </div>

        <!-- Card Body: Identitas & Alamat -->
        <div>
          <h4 class="text-sm font-extrabold text-gray-900 leading-tight">${escapeHtml(item.nama || '-')}</h4>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <a href="${waUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200 text-xs active:bg-green-100">
              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> ${escapeHtml(waDisplay)}
            </a>
            ${item.instagram && item.instagram !== '-' ? `
              <span class="text-xs text-pink-700 font-bold bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-200 flex items-center gap-1">
                <i data-lucide="instagram" class="w-3 h-3"></i> ${escapeHtml(item.instagram)}
              </span>
            ` : ''}
          </div>
          <div class="flex items-start gap-1.5 text-xs text-gray-700 mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <i data-lucide="map-pin" class="w-4 h-4 text-[#D65A3C] flex-shrink-0 mt-0.5"></i>
            <span class="leading-relaxed">${escapeHtml(alamat)}</span>
          </div>
        </div>

        <!-- Quick Code Badge -->
        <div class="flex items-center justify-between text-xs pt-0.5">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-gray-500 font-semibold">Kode Kuis:</span>
            <span class="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded border border-gray-300">
              ${escapeHtml(kodeQuiz)}
            </span>
          </div>
        </div>

        <!-- Action Row: View Photo & Status Buttons -->
        <div class="pt-2 border-t border-gray-100 space-y-2">
          ${photoSrc && photoSrc !== '-' ? `
            <button type="button" class="btn-view-image w-full py-2 bg-blue-50 active:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200" data-src="${escapeHtml(photoSrc)}" data-nama="${escapeHtml(item.nama)}">
              <i data-lucide="image" class="w-3.5 h-3.5"></i> Periksa Bukti Instagram Story
            </button>
          ` : '<p class="text-[11px] text-gray-400 text-center italic">Bukti story tidak diunggah</p>'}

          <div class="grid grid-cols-3 gap-1.5">
            <button type="button" class="btn-status-verify py-2 rounded-xl text-[11px] font-bold text-white bg-green-600 active:bg-green-700 flex items-center justify-center gap-1 shadow-xs" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> Verifikasi
            </button>
            <button type="button" class="btn-status-pending py-2 rounded-xl text-[11px] font-bold text-amber-900 bg-amber-100 active:bg-amber-200 border border-amber-300 flex items-center justify-center gap-1" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i> Tunda
            </button>
            <button type="button" class="btn-status-reject py-2 rounded-xl text-[11px] font-bold text-red-700 bg-red-100 active:bg-red-200 border border-red-300 flex items-center justify-center gap-1" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="x" class="w-3.5 h-3.5"></i> Tolak
            </button>
          </div>
        </div>
      `;

      mobileCardsContainer.appendChild(card);
    });
  }

  // ==========================================
  // RENDER DESKTOP TABLE
  // ==========================================
  function renderDesktopTable(list) {
    submissionsTableBody.innerHTML = '';

    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50/80 transition-colors';

      let statusBadge = '';
      if (item.statusVerifikasi === 'Terverifikasi') {
        statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">Terverifikasi</span>';
      } else if (item.statusVerifikasi === 'Ditolak') {
        statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Ditolak</span>';
      } else {
        statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Menunggu</span>';
      }

      const waDisplay = getItemWhatsApp(item);
      const waNumber = waDisplay.replace(/\D/g, '');
      const waUrl = waNumber ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.nama)},%20kami%20dari%20Kementerian%20PKP...` : '#';
      const alamat = getItemAlamat(item);
      const kodeQuiz = getItemKodeQuiz(item);
      const photoSrc = getItemScreenshot(item);

      tr.innerHTML = `
        <td class="py-3 px-3.5 whitespace-nowrap">
          <p class="font-mono font-extrabold text-pkp-terracotta text-xs">${escapeHtml(item.kodeUnik || '-')}</p>
          <p class="text-[10px] text-gray-500">${escapeHtml(item.timestamp || '-')}</p>
        </td>
        <td class="py-3 px-3.5">
          <p class="font-bold text-gray-900">${escapeHtml(item.nama || '-')}</p>
          ${item.instagram && item.instagram !== '-' ? `
            <p class="text-[11px] text-pink-700 font-medium">IG: ${escapeHtml(item.instagram)}</p>
          ` : ''}
        </td>
        <td class="py-3 px-3.5 whitespace-nowrap">
          <a href="${waUrl}" target="_blank" class="text-green-600 hover:text-green-800 font-mono text-xs flex items-center gap-1 font-semibold">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> ${escapeHtml(waDisplay)}
          </a>
        </td>
        <td class="py-3 px-3.5 max-w-xs">
          <p class="text-xs text-gray-700 leading-relaxed">${escapeHtml(alamat)}</p>
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          <span class="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
            ${escapeHtml(kodeQuiz)}
          </span>
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          ${photoSrc && photoSrc !== '-' ? `
            <button type="button" class="btn-view-image text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 transition-colors" data-src="${escapeHtml(photoSrc)}" data-nama="${escapeHtml(item.nama)}">
              <i data-lucide="image" class="w-3.5 h-3.5"></i> Lihat
            </button>
          ` : '<span class="text-gray-400">-</span>'}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          <div class="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button type="button" class="btn-status-verify p-1.5 rounded text-green-700 hover:bg-green-200 transition-colors" title="Verifikasi" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="check" class="w-4 h-4"></i>
            </button>
            <button type="button" class="btn-status-pending p-1.5 rounded text-amber-700 hover:bg-amber-200 transition-colors" title="Tunda" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="clock" class="w-4 h-4"></i>
            </button>
            <button type="button" class="btn-status-reject p-1.5 rounded text-red-700 hover:bg-red-200 transition-colors" title="Tolak" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      `;

      submissionsTableBody.appendChild(tr);
    });
  }

  function attachActionListeners() {
    document.querySelectorAll('.btn-view-image').forEach(btn => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-src');
        const nama = btn.getAttribute('data-nama');
        if (src) {
          imageModalSrc.src = src;
          imageModalTitle.textContent = `Bukti Story: ${nama}`;
          imageModalDirectLink.href = src;
          imageModal.classList.remove('hidden');
          lucide.createIcons();
        }
      });
    });

    document.querySelectorAll('.btn-status-verify').forEach(btn => {
      btn.addEventListener('click', () => updateStatus(btn.getAttribute('data-id'), 'Terverifikasi'));
    });
    document.querySelectorAll('.btn-status-reject').forEach(btn => {
      btn.addEventListener('click', () => updateStatus(btn.getAttribute('data-id'), 'Ditolak'));
    });
    document.querySelectorAll('.btn-status-pending').forEach(btn => {
      btn.addEventListener('click', () => updateStatus(btn.getAttribute('data-id'), 'Menunggu Verifikasi'));
    });
  }

  btnCloseImageModal.addEventListener('click', () => imageModal.classList.add('hidden'));

  async function updateStatus(id, newStatus) {
    localStorage.setItem('grya_admin_status_' + id, newStatus);

    const item = currentSubmissions.find(s => s.id === id || s.kodeUnik === id || String(s.rowNumber) === String(id));
    if (item) {
      item.statusVerifikasi = newStatus;
      if (item.kodeUnik) localStorage.setItem('grya_admin_status_' + item.kodeUnik, newStatus);
      if (item.rowNumber) localStorage.setItem('grya_admin_status_' + item.rowNumber, newStatus);
      renderDashboard({ submissions: currentSubmissions });
    }

    try {
      const appsScriptUrl = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_APPS_SCRIPT_URL;
      const isOnline = appsScriptUrl && appsScriptUrl.trim().length > 10 && (window.location.hostname.includes('github.io') || !window.location.port || window.location.protocol === 'file:');

      if (isOnline) {
        const url = `${appsScriptUrl}?action=updateStatus&password=${encodeURIComponent(adminPassword)}&id=${encodeURIComponent(id)}&status=${encodeURIComponent(newStatus)}`;
        fetch(url).then(r => r.json()).catch(() => {});
      } else {
        fetch('/api/admin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword
          },
          body: JSON.stringify({ id, status: newStatus })
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Sync status warning:', err);
    }
  }

  // 5. Modal Undi Pemenang
  btnOpenDrawModal.addEventListener('click', () => {
    const verified = currentSubmissions.filter(s => s.statusVerifikasi === 'Terverifikasi');
    poolCountText.textContent = verified.length;
    winnerCard.classList.add('hidden');
    rollingPlaceholder.classList.remove('hidden');
    rollingAnimation.classList.add('hidden');
    drawModal.classList.remove('hidden');
    lucide.createIcons();
  });

  btnCloseDrawModal.addEventListener('click', () => drawModal.classList.add('hidden'));

  btnStartDraw.addEventListener('click', () => {
    const verified = currentSubmissions.filter(s => s.statusVerifikasi === 'Terverifikasi');
    if (verified.length === 0) {
      alert('Belum ada peserta berstatus "Terverifikasi". Silakan verifikasi data peserta terlebih dahulu!');
      return;
    }

    btnStartDraw.disabled = true;
    winnerCard.classList.add('hidden');
    rollingPlaceholder.classList.add('hidden');
    rollingAnimation.classList.remove('hidden');

    let rollCount = 0;
    const maxRolls = 30;
    const interval = setInterval(() => {
      const tempWinner = verified[Math.floor(Math.random() * verified.length)];
      rollingName.textContent = tempWinner.nama;
      const tempWa = getItemWhatsApp(tempWinner);
      if (rollingWa) rollingWa.textContent = `WA: ${tempWa}`;
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(interval);
        finalizeWinner(verified);
      }
    }, 80);
  });

  function finalizeWinner(verifiedPool) {
    const finalWinner = verifiedPool[Math.floor(Math.random() * verifiedPool.length)];
    
    if (window.confetti) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }

    const alamat = getItemAlamat(finalWinner);
    const waDisplay = getItemWhatsApp(finalWinner);
    document.getElementById('winnerNama').textContent = finalWinner.nama;
    document.getElementById('winnerWaNumber').textContent = waDisplay;
    document.getElementById('winnerAlamat').textContent = alamat;
    document.getElementById('winnerBadgeCode').textContent = finalWinner.kodeUnik;

    const waNumber = waDisplay.replace(/\D/g, '');
    const waText = `Halo Selamat ${encodeURIComponent(finalWinner.nama)}! Anda terpilih sebagai Pemenang Undian Kuis Detektif GRYA (Kementerian PKP) dengan Kode Bukti: ${finalWinner.kodeUnik}. Hadiah akan segera dikirimkan ke alamat Anda: ${encodeURIComponent(alamat)}.`;
    document.getElementById('winnerWaLink').href = `https://wa.me/${waNumber}?text=${waText}`;

    rollingAnimation.classList.add('hidden');
    winnerCard.classList.remove('hidden');
    btnStartDraw.disabled = false;
    lucide.createIcons();
  }

  // 6. Modal Config Kode Kuis
  if (btnOpenConfigModal) {
    btnOpenConfigModal.addEventListener('click', () => {
      configModal.classList.remove('hidden');
    });
  }
  if (btnCloseConfigModal) {
    btnCloseConfigModal.addEventListener('click', () => configModal.classList.add('hidden'));
  }
  if (configForm) {
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Kode kuis valid diatur melalui js/config.js (default: 2134)');
      configModal.classList.add('hidden');
    });
  }

  // 7. Ekspor CSV
  btnExportCsv.addEventListener('click', () => {
    if (currentSubmissions.length === 0) {
      alert('Belum ada data untuk diekspor.');
      return;
    }

    const headers = [
      'Timestamp',
      'Kode Unik',
      'Nama Lengkap',
      'Nomor WhatsApp',
      'Alamat Pengiriman Hadiah',
      'Username Instagram',
      'Kode Quiz',
      'Status Verifikasi',
      'Link Screenshot'
    ];

    const rows = currentSubmissions.map(item => [
      `"${item.timestamp || ''}"`,
      `"${item.kodeUnik || ''}"`,
      `"${(item.nama || '').replace(/"/g, '""')}"`,
      `"'${getItemWhatsApp(item)}"`,
      `"${getItemAlamat(item).replace(/"/g, '""')}"`,
      `"${item.instagram || ''}"`,
      `"${getItemKodeQuiz(item)}"`,
      `"${item.statusVerifikasi || ''}"`,
      `"${getItemScreenshot(item)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `peserta_kuis_grya_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
