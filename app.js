// ── CONFIG ──
const ACCOUNTS_URL = 'https://script.google.com/macros/s/AKfycbyDQ-rPiAJd029gaClhD7v_U3sbg8d89pKXF-wcHsP8rleliLSWeN8Jo7gRLRAXFP3d/exec';

const CATS_EXPENSE = [
  { id:'makanan',      label:'Food & Drink (Makan)',    icon:'🍱' },
  { id:'restoran',     label:'Dining Out (Jajan)',       icon:'🍽️' },
  { id:'kebersihan',   label:'Hygiene (Kebersihan)',     icon:'🧴' },
  { id:'rumah',        label:'Household (Rumah)',        icon:'🏠' },
  { id:'transportasi', label:'Travel (Transport)',       icon:'🚗' },
  { id:'pakaian',      label:'Apparel (Baju)',           icon:'👗' },
  { id:'hiburan',      label:'Entertainment (Hiburan)', icon:'🎬' },
  { id:'kesehatan',    label:'Medical (Kesehatan)',      icon:'💊' },
  { id:'pendidikan',   label:'Study (Pendidikan)',       icon:'📚' },
  { id:'komunikasi',   label:'Internet (Kuota/Pulsa)',   icon:'📱' },
  { id:'hadiah',       label:'Gift (Kado/Sosial)',       icon:'🎁' },
];

// ── STATE ──
let currentUser = null;
let SHEET_URL = '';
let entries = [];
let currentEntryType = 'expense';
let selectedINL = 'needs';
let pendingDeleteId = null;

// ── LOGIN ──
async function doLogin() {
  const user = document.getElementById('loginUsername').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();
  const err  = document.getElementById('loginError');
  if (!user || !pass) { err.textContent = 'Username & Password wajib diisi!'; return; }
  err.textContent = 'Memverifikasi... 🍯';
  try {
    const res = await fetch(ACCOUNTS_URL + '?t=' + Date.now());
    const accounts = await res.json();
    const found = accounts.find(a => a.username === user && a.password === pass);
    if (found) {
      currentUser = found;
      SHEET_URL = found.sheet_url;
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
      document.getElementById('userAvatar').textContent = user.charAt(0).toUpperCase();
      document.getElementById('userLabel').textContent = user;
      document.getElementById('loginPassword').value = '';
      err.textContent = '';
      initApp();
    } else {
      err.textContent = 'Username atau Password salah!';
    }
  } catch(e) {
    err.textContent = 'Server Error. Cek koneksi internet!';
  }
}

document.getElementById('loginPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ── LOGOUT ──
function doLogout() {
  if (!confirm('Yakin mau logout?')) return;
  currentUser = null; SHEET_URL = ''; entries = [];
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUsername').value = '';
  closeModal('settingsModal');
}

// ── INIT ──
function initApp() {
  document.getElementById('inputDate').value = new Date().toISOString().split('T')[0];
  setEntryType('expense');
  loadFromSheet();
}

// ── LOAD ──
async function loadFromSheet() {
  document.getElementById('historyListHome').innerHTML = '<div class="loading-state">⏳ Memuat data...</div>';
  document.getElementById('historyListFull').innerHTML = '<div class="loading-state">⏳ Memuat data...</div>';
  try {
    const res  = await fetch(SHEET_URL + '?t=' + Date.now());
    const data = await res.json();
    entries = data.map(r => ({
      id:       r.id,
      date:     formatDateFromSheet(r.date),
      type:     r.type,
      catLabel: r.catLabel  || '',
      catIcon:  r.catIcon   || (r.type === 'income' ? '💵' : '💸'),
      inlLabel: r.inlLabel  || '',
      amount:   parseFloat(r.amount) || 0,
      desc:     r.desc || '',
      status:   r.status || '',
      reason:   r.reason || ''
    }));
    updateSummary();
    renderHistory();
  } catch(e) {
    showToast('⚠️ Gagal muat data');
    document.getElementById('historyListHome').innerHTML = '<div class="loading-state">Gagal memuat. Cek koneksi.</div>';
    document.getElementById('historyListFull').innerHTML = '<div class="loading-state">Gagal memuat. Cek koneksi.</div>';
  }
}

function formatDateFromSheet(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    if (val.match(/^\d{4}-\d{2}-\d{2}/)) return val.substring(0, 10);
    if (val.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
      const [d, m, y] = val.split('/');
      return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
  }
  const d = new Date(val);
  if (!isNaN(d)) return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  return String(val);
}

// ── SAVE ──
async function saveEntry() {
  const rawAmount = document.getElementById('inputAmount').value.replace(/\./g, '');
  const amount    = parseInt(rawAmount);
  const date      = document.getElementById('inputDate').value;
  const desc      = document.getElementById('inputDesc').value.trim();
  const catSel    = document.getElementById('selectCatExp');
  const customSrc = document.getElementById('inputCustomSource').value.trim();

  if (!amount || amount <= 0) { showToast('⚠️ Isi jumlah dulu!'); return; }
  if (!date)                  { showToast('⚠️ Pilih tanggal dulu!'); return; }
  if (currentEntryType === 'expense' && !desc) { showToast('⚠️ Keterangan wajib untuk pengeluaran!'); return; }
  if (currentEntryType === 'income' && catSel.value === 'lain' && !customSrc) { showToast('⚠️ Isi sumber pendapatannya!'); return; }

  let catLabel, catIcon;
  if (currentEntryType === 'expense') {
    const cat = CATS_EXPENSE.find(c => c.id === catSel.value);
    catLabel = cat ? cat.label : '';
    catIcon  = cat ? cat.icon  : '💸';
  } else {
    catLabel = catSel.value === 'lain' ? customSrc : 'Dari Apih';
    catIcon  = '💵';
  }

  const entry = {
    id: Date.now(), type: currentEntryType, date, catLabel, catIcon,
    inlLabel: currentEntryType === 'expense' ? (selectedINL === 'needs' ? 'Needs' : 'Lifestyle') : 'Income',
    amount, desc: desc || '-', status: '', reason: ''
  };

  entries.unshift(entry);
  updateSummary();
  renderHistory();
  closeModal('addModal');
  resetForm();
  showToast('💾 Menyimpan...');

  try {
    await fetch(SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    showToast('✅ Tersimpan!');
  } catch(e) {
    showToast('❌ Gagal kirim ke Sheet');
  }
}

// ── DELETE (SOFT) ──
function deleteEntry(id) {
  pendingDeleteId = id;
  document.getElementById('deleteReason').value = '';
  document.getElementById('deleteModal').classList.remove('hidden');
}

async function processDelete() {
  const reason = document.getElementById('deleteReason').value.trim();
  if (!reason) { showToast('⚠️ Isi alasannya dulu!'); return; }

  const target = entries.find(e => String(e.id) === String(pendingDeleteId));
  if (!target) { closeModal('deleteModal'); return; }

  target.status = 'DIHAPUS';
  target.reason = reason;

  closeModal('deleteModal');
  updateSummary();
  renderHistory();
  showToast('🗑️ Data ditandai dihapus');

  try {
    await fetch(SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        id: target.id,
        date: target.date,
        amount: target.amount,
        desc: target.desc,
        reason
      })
    });
  } catch(e) {
    showToast('⚠️ Gagal sinkron ke Sheet');
  }
  pendingDeleteId = null;
}

// ── RENDER ──
function renderHistory() {
  const today  = new Date().toISOString().split('T')[0];
  const colors = ['bg-sage', 'bg-terra', 'bg-sand'];

  const cardHTML = (e, i) => {
    const isDeleted  = e.status === 'DIHAPUS';
    const badgeClass = e.type === 'income' ? 'badge-income' : (e.inlLabel === 'Needs' ? 'badge-needs' : 'badge-lifestyle');
    if (isDeleted) {
      return `
      <div class="clay-card" style="background:#d1d1d1; opacity:0.65; margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; gap:14px; align-items:center; flex:1; min-width:0;">
            <div style="background:rgba(255,255,255,0.3); width:48px; height:48px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; filter:grayscale(1); flex-shrink:0;">${e.catIcon}</div>
            <div style="min-width:0;">
              <div style="font-weight:800; font-size:0.95rem; text-decoration:line-through; opacity:0.7;">${e.desc || '—'}</div>
              <div style="font-size:0.72rem; font-weight:600; color:#FF5252;">DIHAPUS: ${e.reason}</div>
              <span class="badge badge-needs">${e.catLabel}</span>
            </div>
          </div>
          <div style="font-weight:900; font-size:1rem; text-decoration:line-through; opacity:0.6; flex-shrink:0; margin-left:10px;">
            ${e.type==='income'?'+':'−'}Rp ${e.amount.toLocaleString('id-ID')}
          </div>
        </div>
      </div>`;
    }
    return `
    <div class="clay-card ${colors[i % 3]}" style="margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:14px; align-items:center; flex:1; min-width:0;">
          <div style="background:rgba(255,255,255,0.3); width:48px; height:48px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0;">${e.catIcon}</div>
          <div style="min-width:0;">
            <div style="font-weight:800; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.desc || '—'}</div>
            <div style="font-size:0.72rem; font-weight:600; opacity:0.65;">${e.catLabel}</div>
            <span class="badge ${badgeClass}">${e.inlLabel || ''}</span>
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0; margin-left:10px;">
          <div style="font-weight:900; font-size:1rem;">${e.type==='income'?'+':'−'}Rp ${e.amount.toLocaleString('id-ID')}</div>
          <span class="del-btn-text" onclick="deleteEntry('${e.id}')">DELETE ✕</span>
        </div>
      </div>
    </div>`;
  };

  const todayEntries = entries.filter(e => e.date === today);
  document.getElementById('historyListHome').innerHTML = todayEntries.length
    ? todayEntries.map((e,i) => cardHTML(e,i)).join('')
    : '<div class="loading-state">Belum ada transaksi hari ini 🌱</div>';

  const grouped = {};
  entries.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
  const sortedDates = Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));
  document.getElementById('historyListFull').innerHTML = sortedDates.length
    ? sortedDates.map(date => {
        const label = date === today ? 'Today (Hari Ini)' : new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'});
        return `
        <details style="margin-bottom:14px;" ${date === today ? 'open' : ''}>
          <summary style="font-weight:800; color:var(--card-sand); cursor:pointer; padding:8px 4px; display:flex; justify-content:space-between; align-items:center; user-select:none;">
            <span>📅 ${label}</span>
            <span style="font-size:0.7rem; opacity:0.5;">▾</span>
          </summary>
          <div style="margin-top:10px;">${grouped[date].map((e,i) => cardHTML(e,i)).join('')}</div>
        </details>`;
      }).join('')
    : '<div class="loading-state">Belum ada data 📭</div>';
}

// ── SUMMARY ──
function updateSummary() {
  const active = entries.filter(e => e.status !== 'DIHAPUS');
  const inc = active.filter(e => e.type==='income').reduce((s,e) => s+e.amount, 0);
  const exp = active.filter(e => e.type==='expense').reduce((s,e) => s+e.amount, 0);
  const bal = inc - exp;
  animateValue('sumBalance', bal);
  // Di dalam fungsi updateSummary()
// Cukup update angkanya saja karena label sudah ada di HTML
document.getElementById('sumIncome').textContent = inc.toLocaleString('id-ID');
document.getElementById('sumExpense').textContent = exp.toLocaleString('id-ID');
}

function animateValue(id, end) {
  const el = document.getElementById(id);
  const start = 0, duration = 500;
  let startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / duration, 1);
    el.textContent = 'Rp ' + Math.floor(p * end).toLocaleString('id-ID');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── FORM ──
function setEntryType(t) {
  currentEntryType = t;
  document.getElementById('btnExp').classList.toggle('active', t==='expense');
  document.getElementById('btnInc').classList.toggle('active', t==='income');
  document.getElementById('labelWrap').style.display = t==='expense' ? 'block' : 'none';
  document.getElementById('customSourceWrap').classList.add('hidden');
  document.getElementById('inputDesc').placeholder = t==='expense' ? 'Duitnya dipake buat apa?' : 'Keterangan (opsional)';
  renderCats();
}

function setLabel(val) {
  selectedINL = val;
  document.getElementById('btnNeeds').classList.toggle('active', val==='needs');
  document.getElementById('btnLifestyle').classList.toggle('active', val==='lifestyle');
}

function renderCats() {
  const s = document.getElementById('selectCatExp');
  s.innerHTML = currentEntryType === 'expense'
    ? CATS_EXPENSE.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')
    : '<option value="apih">👨 Dari Apih</option><option value="lain">✏️ Sumber Lain</option>';
}

function onCatChange() {
  const val = document.getElementById('selectCatExp').value;
  document.getElementById('customSourceWrap').classList.toggle('hidden', !(currentEntryType === 'income' && val === 'lain'));
}

function formatAmount(el) {
  const raw = el.value.replace(/\D/g, '');
  el.value = raw ? parseInt(raw).toLocaleString('id-ID') : '';
}

function resetForm() {
  document.getElementById('inputAmount').value = '';
  document.getElementById('inputDesc').value = '';
  document.getElementById('inputCustomSource').value = '';
  document.getElementById('customSourceWrap').classList.add('hidden');
  setEntryType('expense');
  setLabel('needs');
}

// ── SETTINGS ──
function openSettings() {
  document.getElementById('settingUser').textContent = currentUser ? currentUser.username : '';
  document.getElementById('pwdSection').classList.add('hidden');
  document.getElementById('pwdTriggerRow').classList.remove('hidden');
  document.getElementById('newPwd').value = '';
  document.getElementById('confirmPwd').value = '';
  document.getElementById('pwdError').textContent = '';
  document.getElementById('settingsModal').classList.remove('hidden');
}

function showPwdFields() {
  document.getElementById('pwdSection').classList.remove('hidden');
  document.getElementById('pwdTriggerRow').classList.add('hidden');
}

function hidePwdFields() {
  document.getElementById('pwdSection').classList.add('hidden');
  document.getElementById('pwdTriggerRow').classList.remove('hidden');
}

async function confirmNewPwd() {
  const newPass  = document.getElementById('newPwd').value.trim();
  const confPass = document.getElementById('confirmPwd').value.trim();
  const errEl    = document.getElementById('pwdError');
  if (!newPass)             { errEl.textContent = 'Isi password baru.'; return; }
  if (newPass.length < 4)   { errEl.textContent = 'Minimal 4 karakter.'; return; }
  if (newPass !== confPass) { errEl.textContent = 'Password tidak cocok.'; return; }
  try {
    await fetch(ACCOUNTS_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, new_password: newPass })
    });
    showToast('✅ Password berhasil diubah!');
    hidePwdFields();
    closeModal('settingsModal');
  } catch(e) {
    errEl.textContent = 'Gagal. Coba lagi.';
  }
}

// ── MODAL & NAV ──
function openAddModal() {
  resetForm();
  document.getElementById('inputDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('addModal').classList.remove('hidden');
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function closeModalOnOut(e, id) { if (e.target.id === id) closeModal(id); }

function switchPanel(p, el) { 
    // Sembunyikan semua panel
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active')); 
    // Tampilkan panel yang dipilih
    document.getElementById('panel-'+p).classList.add('active'); 
    
    // Reset semua nav-item
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active')); 
    // Aktifkan yang diklik
    if (el) el.classList.add('active'); 
}

// ── TOAST ──
let toastTimer;
function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
