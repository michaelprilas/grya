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
  const rollingNip = document.getElementById('rollingNip');
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
  }

  // 1. Inisialisasi Auth
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

        if (data.currentQuizCode) {
          newQuizCodeInput.value = data.currentQuizCode;
        }

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

  // 2. Fetch & Render Data
  async function loadData() {
    if (!adminPassword) return;
    try {
      const url = getAdminApiUrl(adminPassword);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        renderDashboard(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }

  function renderDashboard(data) {
    currentSubmissions = data.submissions || [];
    
    // Update Stats Counts
    const total = currentSubmissions.length;
    const verified = currentSubmissions.filter(s => s.statusVerifikasi === 'Terverifikasi').length;
    const pending = currentSubmissions.filter(s => s.statusVerifikasi === 'Menunggu Verifikasi').length;
    const rejected = currentSubmissions.filter(s => s.statusVerifikasi === 'Ditolak').length;

    statTotal.textContent = total;
    statVerified.textContent = verified;
    statPending.textContent = pending;
    statRejected.textContent = rejected;

    // Update Filter Tab Badge Numbers
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

  // Search input handling
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

  // 4. Filter & Render Both Views (Mobile Cards & Desktop Table)
  function applyFilterAndRender() {
    const query = searchInput.value.toLowerCase().trim();

    let filtered = currentSubmissions.filter(item => {
      const matchStatus = (selectedStatus === 'Semua') || (item.statusVerifikasi === selectedStatus);
      const matchQuery = !query || 
        (item.nama && item.nama.toLowerCase().includes(query)) ||
        (item.nip && item.nip.includes(query)) ||
        (item.whatsapp && item.whatsapp.includes(query)) ||
        (item.instagram && item.instagram.toLowerCase().includes(query)) ||
        (item.kodeUnik && item.kodeUnik.toLowerCase().includes(query)) ||
        (item.unitOrganisasi && item.unitOrganisasi.toLowerCase().includes(query));

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
  // RENDER MOBILE CARDS (Ergonomic for HP)
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

      const waNumber = (item.whatsapp || '').replace(/\D/g, '');
      const waUrl = `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.nama)},%20kami%20dari%20Kementerian%20PKP%20terkait%20Kuis%20Detektif%20GRYA...`;
      const igHandle = (item.instagram || '').replace('@', '');
      const igUrl = `https://instagram.com/${igHandle}`;
      const photoSrc = item.screenshotUrl || item.linkScreenshot || '';

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

        <!-- Card Body: Identitas -->
        <div>
          <h4 class="text-sm font-extrabold text-gray-900 leading-tight">${escapeHtml(item.nama || '-')}</h4>
          <p class="text-xs font-mono text-gray-600 font-semibold mt-0.5">NIP: ${escapeHtml(item.nip || '-')}</p>
          <div class="flex items-start gap-1 text-[11px] text-gray-600 mt-1.5 bg-gray-50 p-2 rounded-xl">
            <i data-lucide="building-2" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5"></i>
            <span class="truncate"><strong>${escapeHtml(item.unitOrganisasi || '-')}</strong> — ${escapeHtml(item.unitKerja || '-')}</span>
          </div>
        </div>

        <!-- Quick Contacts & Code Badge -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs pt-1">
          <div class="flex items-center gap-1.5">
            <a href="${waUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200 text-[11px] active:bg-green-100">
              <i data-lucide="message-circle" class="w-3 h-3"></i> WA
            </a>
            <a href="${igUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 font-bold rounded-lg border border-pink-200 text-[11px] active:bg-pink-100">
              <i data-lucide="instagram" class="w-3 h-3"></i> ${escapeHtml(item.instagram || '-')}
            </a>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-gray-500 font-semibold">Kode:</span>
            <span class="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
              ${escapeHtml(item.kodeQuiz || '-')}
            </span>
          </div>
        </div>

        <!-- Action Row: View Photo & Status Segmentation -->
        <div class="pt-2 border-t border-gray-100 space-y-2">
          ${photoSrc ? `
            <button type="button" class="btn-view-image w-full py-2 bg-blue-50 active:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200" data-src="${escapeHtml(photoSrc)}" data-nama="${escapeHtml(item.nama)}">
              <i data-lucide="image" class="w-3.5 h-3.5"></i> Periksa Bukti Instagram Story
            </button>
          ` : ''}

          <!-- Verification Segmented Buttons -->
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

      const waNumber = (item.whatsapp || '').replace(/\D/g, '');
      const waUrl = `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.nama)},%20kami%20dari%20Kementerian%20PKP...`;
      const igHandle = (item.instagram || '').replace('@', '');
      const igUrl = `https://instagram.com/${igHandle}`;
      const photoSrc = item.screenshotUrl || item.linkScreenshot || '';

      tr.innerHTML = `
        <td class="py-3 px-3.5 whitespace-nowrap">
          <p class="font-mono font-extrabold text-pkp-terracotta text-xs">${escapeHtml(item.kodeUnik || '-')}</p>
          <p class="text-[10px] text-gray-500">${escapeHtml(item.timestamp || '-')}</p>
        </td>
        <td class="py-3 px-3.5">
          <p class="font-bold text-gray-900">${escapeHtml(item.nama || '-')}</p>
          <p class="text-[11px] font-mono text-gray-600">NIP: ${escapeHtml(item.nip || '-')}</p>
        </td>
        <td class="py-3 px-3.5">
          <p class="font-medium text-gray-800">${escapeHtml(item.unitOrganisasi || '-')}</p>
          <p class="text-[11px] text-gray-500">${escapeHtml(item.unitKerja || '-')}</p>
        </td>
        <td class="py-3 px-3.5 whitespace-nowrap">
          <div class="flex flex-col gap-1">
            <a href="${waUrl}" target="_blank" class="text-green-600 hover:text-green-800 font-mono text-xs flex items-center gap-1 font-semibold">
              <i data-lucide="message-circle" class="w-3 h-3"></i> ${escapeHtml(item.whatsapp || '-')}
            </a>
            <a href="${igUrl}" target="_blank" class="text-pkp-terracotta hover:underline text-xs flex items-center gap-1">
              <i data-lucide="instagram" class="w-3 h-3"></i> ${escapeHtml(item.instagram || '-')}
            </a>
          </div>
        </td>
        <td class="py-3 px-3.5 text-center">
          <span class="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
            ${escapeHtml(item.kodeQuiz || '-')}
          </span>
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          ${photoSrc ? `
            <button type="button" class="btn-view-image text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 transition-colors" data-src="${escapeHtml(photoSrc)}" data-nama="${escapeHtml(item.nama)}">
              <i data-lucide="image" class="w-3 h-3"></i> Lihat
            </button>
          ` : '-'}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          <div class="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button type="button" class="btn-status-verify p-1 rounded text-green-700 hover:bg-green-200 transition-colors" title="Verifikasi" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="check" class="w-4 h-4"></i>
            </button>
            <button type="button" class="btn-status-pending p-1 rounded text-amber-700 hover:bg-amber-200 transition-colors" title="Tunda" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="clock" class="w-4 h-4"></i>
            </button>
            <button type="button" class="btn-status-reject p-1 rounded text-red-700 hover:bg-red-200 transition-colors" title="Tolak" data-id="${escapeHtml(item.id || item.kodeUnik)}">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      `;

      submissionsTableBody.appendChild(tr);
    });
  }

  function attachActionListeners() {
    // 1. Image View Modal
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

    // 2. Status Buttons
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

  async function updateStatus(id, newStatus) {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ id, status: newStatus })
      });

      if (res.ok) {
        const item = currentSubmissions.find(s => s.id === id || s.kodeUnik === id);
        if (item) item.statusVerifikasi = newStatus;
        loadData();
      } else {
        alert('Gagal mengubah status.');
      }
    } catch (err) {
      alert('Kesalahan koneksi saat mengubah status.');
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
      rollingNip.textContent = `NIP: ${tempWinner.nip}`;
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(interval);
        finalizeWinner(verified);
      }
    }, 80);
  });

  function finalizeWinner(verifiedPool) {
    const finalWinner = verifiedPool[Math.floor(Math.random() * verifiedPool.length)];
    
    // Confetti
    if (window.confetti) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }

    document.getElementById('winnerNama').textContent = finalWinner.nama;
    document.getElementById('winnerNip').textContent = finalWinner.nip;
    document.getElementById('winnerIg').textContent = finalWinner.instagram;
    document.getElementById('winnerUnit').textContent = `${finalWinner.unitOrganisasi} — ${finalWinner.unitKerja}`;
    document.getElementById('winnerWa').textContent = finalWinner.whatsapp;
    document.getElementById('winnerBadgeCode').textContent = finalWinner.kodeUnik;

    const waNumber = (finalWinner.whatsapp || '').replace(/\D/g, '');
    const waText = `Halo Selamat ${encodeURIComponent(finalWinner.nama)}! Anda terpilih sebagai Pemenang Kuis Detektif GRYA (Kementerian PKP) dengan Kode Bukti: ${finalWinner.kodeUnik}.`;
    document.getElementById('winnerWaLink').href = `https://wa.me/${waNumber}?text=${waText}`;

    rollingAnimation.classList.add('hidden');
    winnerCard.classList.remove('hidden');
    btnStartDraw.disabled = false;
    lucide.createIcons();
  }

  // 6. Modal Gambar Bukti
  btnCloseImageModal.addEventListener('click', () => imageModal.classList.add('hidden'));

  // 7. Modal Pengaturan Kode Kuis
  btnOpenConfigModal.addEventListener('click', () => {
    configModal.classList.remove('hidden');
  });

  btnCloseConfigModal.addEventListener('click', () => configModal.classList.add('hidden'));

  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newCode = newQuizCodeInput.value.trim();
    if (!newCode) return;

    try {
      const res = await fetch('/api/admin/config/quiz-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ newCode })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        configModal.classList.add('hidden');
      } else {
        alert('Gagal memperbarui kode kuis.');
      }
    } catch (err) {
      alert('Kesalahan koneksi.');
    }
  });

  // 8. Ekspor CSV
  btnExportCsv.addEventListener('click', () => {
    if (currentSubmissions.length === 0) {
      alert('Belum ada data untuk diekspor.');
      return;
    }

    const headers = [
      'Timestamp',
      'Kode Unik',
      'Nama Lengkap',
      'NIP',
      'Unit Organisasi',
      'Unit Kerja',
      'Nomor WhatsApp',
      'Username Instagram',
      'Kode Quiz',
      'Status Verifikasi',
      'Link Screenshot'
    ];

    const rows = currentSubmissions.map(item => [
      `"${item.timestamp || ''}"`,
      `"${item.kodeUnik || ''}"`,
      `"${(item.nama || '').replace(/"/g, '""')}"`,
      `"'${item.nip || ''}"`,
      `"${(item.unitOrganisasi || '').replace(/"/g, '""')}"`,
      `"${(item.unitKerja || '').replace(/"/g, '""')}"`,
      `"'${item.whatsapp || ''}"`,
      `"${item.instagram || ''}"`,
      `"${item.kodeQuiz || ''}"`,
      `"${item.statusVerifikasi || ''}"`,
      `"${item.screenshotUrl || item.linkScreenshot || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `peserta_detektif_grya_${Date.now()}.csv`);
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
