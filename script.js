const GS_URL = 'https://script.google.com/macros/s/AKfycbx8y-8eveHIcIAUTvIdeQBB-WsO2jQSNdaonzq6IPxwnMuG6UADoc468ebzhysWviStYA/exec';

let allRecords = [];
let currentService = '';
let providers = [];

async function loadProviders() {
  try {
    const res = await fetch(GS_URL + '?action=getProviders');
    providers = await res.json();
  } catch(e) {
    console.error('loadProviders error', e);
    providers = ['ครูพยาบาล', 'นักเรียนอาสา'];
  }
}
async function gsGet() {
  try {
    const res = await fetch(GS_URL);
    const data = await res.json();
    return data;
  } catch(e) {
    console.error('gsGet error', e);
    return [];
  }
}

async function gsPost(payload) {
  try {
    const res = await fetch(GS_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.ok === true;
  } catch(e) {
    console.error('gsPost error', e);
    return false;
  }
}

async function loadRecords() {
  allRecords = await gsGet();
  if (document.getElementById('page-admin').classList.contains('active')) {
    renderAdminDashboard();
    renderRecords();
  }
}

const defaultConfig = {
  app_title: 'CRS (Clinic Record System)',
  slogan_line1: 'งานพยาบาลและงานอนามัย',
  slogan_line2: 'ดูแล ส่งเสริม และป้องกัน',
  slogan_line3: 'สุขภาพนักเรียนและบุคลากรในสถานศึกษา',
  emergency_phone: '061-467-9176',
  facebook_label: 'งานพยาบาลและงานอนามัยโรงเรียนอรัญประเทศ',
  background_color: '#dbeafe',
  surface_color: '#ffffff',
  text_color: '#1e40af',
  primary_action_color: '#2563eb',
  secondary_action_color: '#3b82f6',
  font_family: 'Prompt',
  font_size: 16
};

if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange: async (config) => {
      const c = key => config[key] || defaultConfig[key];
      document.getElementById('el-title').textContent = c('app_title');
      document.getElementById('el-slogan1').textContent = c('slogan_line1');
      document.getElementById('el-slogan2').textContent = c('slogan_line2');
      document.getElementById('el-slogan3').textContent = c('slogan_line3');
      document.getElementById('el-emergency').textContent = c('emergency_phone');
      document.getElementById('el-fb').textContent = c('facebook_label');
      document.body.style.fontFamily = c('font_family') + ', Prompt, sans-serif';
      document.documentElement.style.fontSize = c('font_size') + 'px';
      document.querySelectorAll('.nurse-bg').forEach(el => el.style.background = 'linear-gradient(135deg, ' + c('background_color') + ' 0%, #f0f9ff 100%)');
      document.querySelectorAll('.header-gradient').forEach(el => el.style.background = 'linear-gradient(135deg, ' + c('text_color') + ' 0%, ' + c('primary_action_color') + ' 50%, ' + c('secondary_action_color') + ' 100%)');
    },
    mapToCapabilities: (config) => {
      const c = key => config[key] || defaultConfig[key];
      const mkColor = (key) => ({
        get: () => c(key),
        set: (v) => { config[key] = v; window.elementSdk.setConfig({ [key]: v }); }
      });
      return {
        recolorables: [mkColor('background_color'), mkColor('surface_color'), mkColor('text_color'), mkColor('primary_action_color'), mkColor('secondary_action_color')],
        borderables: [],
        fontEditable: { get: () => c('font_family'), set: (v) => { config.font_family = v; window.elementSdk.setConfig({ font_family: v }); } },
        fontSizeable: { get: () => c('font_size'), set: (v) => { config.font_size = v; window.elementSdk.setConfig({ font_size: v }); } }
      };
    },
    mapToEditPanelValues: (config) => {
      const c = key => config[key] || defaultConfig[key];
      return new Map([
        ['app_title', c('app_title')],
        ['slogan_line1', c('slogan_line1')],
        ['slogan_line2', c('slogan_line2')],
        ['slogan_line3', c('slogan_line3')],
        ['emergency_phone', c('emergency_phone')],
        ['facebook_label', c('facebook_label')]
      ]);
    }
  });
} else {
  
  console.info('elementSdk ไม่พร้อมใช้งาน — ใช้ค่าเริ่มต้นแทน');
}

loadRecords();

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (id === 'admin') {
    loadRecords().then(() => {
      renderAdminDashboard();
      renderRecords();
      renderProviders();
    });
  }
  window.scrollTo(0, 0);
}


function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 2500);
}
function showError(msg) {
  const t = document.getElementById('error-toast');
  document.getElementById('error-toast-msg').textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// ===== PIN MODAL =====
function openPinModal() {
  document.getElementById('pin-modal').classList.remove('modal-hidden');
  document.getElementById('pin-modal').classList.add('modal-visible');
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-error').classList.add('hidden');
}
function closePinModal() {
  document.getElementById('pin-modal').classList.add('modal-hidden');
  document.getElementById('pin-modal').classList.remove('modal-visible');
}
function checkPin() {
  if (document.getElementById('pin-input').value === '123456') {
    closePinModal();
    showPage('admin');
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
  }
}

// ===== DELETE MODAL =====
let pendingDeleteRecord = null;
function openDeleteModal(record) {
  pendingDeleteRecord = record;
  document.getElementById('delete-msg').textContent = 'ต้องการลบเคส ' + record.case_id + ' หรือไม่?';
  document.getElementById('delete-modal').classList.remove('modal-hidden');
  document.getElementById('delete-modal').classList.add('modal-visible');
  document.getElementById('confirm-delete-btn').onclick = confirmDelete;
}
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('modal-hidden');
  document.getElementById('delete-modal').classList.remove('modal-visible');
  pendingDeleteRecord = null;
}
async function confirmDelete() {
  if (!pendingDeleteRecord) return;
  const btn = document.getElementById('confirm-delete-btn');
  btn.textContent = 'กำลังลบ...';
  btn.disabled = true;
  const ok = await gsPost({ action: 'delete', case_id: pendingDeleteRecord.case_id });
  btn.textContent = 'ลบ';
  btn.disabled = false;
  closeDeleteModal();
  if (ok) {
    showToast('ลบข้อมูลสำเร็จ');
    await loadRecords();
    renderAdminDashboard();
    renderRecords();
  } else {
    showError('ลบข้อมูลไม่สำเร็จ');
  }
}

// ===== SERVICE SELECTION =====
async function selectService(type) {
  currentService = type;
  document.querySelectorAll('.service-fields').forEach(f => f.classList.add('hidden'));
  document.getElementById('fields-' + type).classList.remove('hidden');
  ['f-symptom','f-medicine','f-cause','f-area','f-rest-time','f-rest-symptom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.required = false;
  });
  if (type === 'medicine') {
    document.getElementById('f-symptom').required = true;
    document.getElementById('f-medicine').required = true;
  }
  if (type === 'wound') {
    document.getElementById('f-cause').required = true;
    document.getElementById('f-area').required = true;
  }
  if (type === 'rest') {
    document.getElementById('f-rest-time').required = true;
    document.getElementById('f-rest-symptom').required = true;
  }
  const titles = { medicine: '💊 บันทึกการรับยา', wound: '🩹 บันทึกการทำแผล', rest: '🛏️ บันทึกการนอนพัก' };
  document.getElementById('form-title').textContent = titles[type];
document.getElementById('form-case-id').textContent = generateCaseId();
  await loadProviders();
  updateProviderDropdown();
  document.getElementById('clinic-form').reset();
  showPage('form');
}

function generateCaseId() {
  const d = new Date();
  const ds = d.getFullYear().toString() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  const todayRecords = allRecords.filter(r => r.case_id && r.case_id.includes(ds));
  const seq = String(todayRecords.length + 1).padStart(4, '0');
  return 'CRS-' + ds + '-' + seq;
}

function updateProviderDropdown() {
  const sel = document.getElementById('f-provider');
  sel.innerHTML = '<option value="">-- เลือกผู้ให้บริการ --</option>';
  providers.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    sel.appendChild(opt);
  });
}

// ===== SUBMIT =====
async function submitForm() {
  const form = document.getElementById('clinic-form');
  const sid = document.getElementById('f-sid').value;
  if (!/^\d{5}$/.test(sid)) { showError('รหัสนักเรียนต้องเป็นตัวเลข 5 หลัก'); return; }
  if (!form.checkValidity()) { showError('กรุณากรอกข้อมูลให้ครบ'); return; }
  if (!document.getElementById('f-provider').value) { showError('กรุณาเลือกผู้ให้บริการ'); return; }

  const caseId = document.getElementById('form-case-id').textContent;
  const base = {
    case_id: caseId,
    date: new Date().toISOString(),
    name: document.getElementById('f-name').value,
    age: document.getElementById('f-age').value,
    gender: document.getElementById('f-gender').value,
    room: document.getElementById('f-room').value,
    phone: document.getElementById('f-phone').value || '',
    student_id: sid,
    service_type: currentService,
    provider: document.getElementById('f-provider').value,
    symptom: '', medicine: '', cause: '', wound_area: '', rest_start: '', detail_summary: ''
  };

  if (currentService === 'medicine') {
    base.symptom = document.getElementById('f-symptom').value;
    base.medicine = document.getElementById('f-medicine').value;
    base.detail_summary = 'อาการ: ' + base.symptom + ', ยา: ' + base.medicine;
  } else if (currentService === 'wound') {
    base.cause = document.getElementById('f-cause').value;
    base.wound_area = document.getElementById('f-area').value;
    base.detail_summary = 'สาเหตุ: ' + base.cause + ', บริเวณ: ' + base.wound_area;
  } else {
    base.rest_start = document.getElementById('f-rest-time').value;
    base.symptom = document.getElementById('f-rest-symptom').value;
    base.medicine = document.getElementById('f-rest-med').value || 'ไม่มี';
    base.detail_summary = 'เวลา: ' + base.rest_start + ', อาการ: ' + base.symptom + ', ยา: ' + base.medicine;
  }

  const btn = document.getElementById('submit-btn');
  btn.textContent = '⏳ กำลังบันทึก...';
  btn.disabled = true;
  const ok = await gsPost(base);
  btn.textContent = '✅ บันทึกข้อมูล';
  btn.disabled = false;

  if (ok) {
    allRecords.push(base);
    document.getElementById('success-case').textContent = caseId;
    document.getElementById('success-name').textContent = base.name;
    showPage('success');
  } else {
    showError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
  }
}

// ===== ADMIN =====
function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => {
    t.classList.remove('bg-med-600', 'text-white');
    t.classList.add('bg-med-100', 'text-med-700');
  });
  document.querySelector('.admin-tab[data-tab="' + tab + '"]').classList.remove('bg-med-100', 'text-med-700');
  document.querySelector('.admin-tab[data-tab="' + tab + '"]').classList.add('bg-med-600', 'text-white');
  document.querySelectorAll('.admin-content').forEach(c => c.classList.add('hidden'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
}

function renderAdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  document.getElementById('admin-total').textContent = allRecords.length;
  document.getElementById('admin-month').textContent = allRecords.filter(r => r.date && r.date.slice(0, 7) === thisMonth).length;
  document.getElementById('admin-today').textContent = allRecords.filter(r => r.date && r.date.slice(0, 10) === today).length;

  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: d.toISOString().slice(0, 7), label: (d.getMonth()+1) + '/' + String(d.getFullYear()).slice(2) });
  }
  const counts = months.map(m => allRecords.filter(r => r.date && r.date.slice(0, 7) === m.key).length);
  const max = Math.max(...counts, 1);

  const chartArea = document.getElementById('chart-area');
  const chartLabels = document.getElementById('chart-labels');
  chartArea.innerHTML = '';
  chartLabels.innerHTML = '';
  months.forEach((m, i) => {
    const pct = (counts[i] / max) * 100;
    const bar = document.createElement('div');
    bar.className = 'flex-1 rounded-t-md transition-all duration-500';
    bar.style.height = Math.max(pct, 4) + '%';
    bar.style.background = i === months.length - 1 ? '#2563eb' : '#93c5fd';
    bar.title = m.label + ': ' + counts[i] + ' เคส';
    chartArea.appendChild(bar);
    const lbl = document.createElement('div');
    lbl.className = 'flex-1 text-center text-[9px] text-med-500';
    lbl.textContent = m.label;
    chartLabels.appendChild(lbl);
  });

  const monthRecs = allRecords.filter(r => r.date && r.date.slice(0, 7) === thisMonth);
  const bd = document.getElementById('service-breakdown');
  bd.innerHTML = '';
  [{key:'medicine',label:'💊 รับยา',color:'#3b82f6'},{key:'wound',label:'🩹 ทำแผล',color:'#22c55e'},{key:'rest',label:'🛏️ นอนพัก',color:'#a855f7'}].forEach(s => {
    const cnt = monthRecs.filter(r => r.service_type === s.key).length;
    const pct = monthRecs.length ? (cnt / monthRecs.length * 100) : 0;
    bd.innerHTML += '<div class="flex items-center gap-3"><span class="text-sm w-20">' + s.label + '</span><div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden"><div class="h-full rounded-full transition-all duration-500" style="width:' + pct + '%;background:' + s.color + '"></div></div><span class="text-sm font-bold w-8 text-right">' + cnt + '</span></div>';
  });
}

function renderRecords() {
  const query = (document.getElementById('search-input').value || '').toLowerCase();
  const filtered = allRecords.filter(r =>
    (r.name && r.name.toLowerCase().includes(query)) ||
    (r.case_id && r.case_id.toLowerCase().includes(query)) ||
    (r.student_id && String(r.student_id).includes(query))
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const list = document.getElementById('records-list');
  list.innerHTML = '';
  document.getElementById('no-records').classList.toggle('hidden', filtered.length > 0);

  const icons = { medicine: '💊', wound: '🩹', rest: '🛏️' };
  const labels = { medicine: 'รับยา', wound: 'ทำแผล', rest: 'นอนพัก' };

  filtered.forEach(r => {
    const d = r.date ? new Date(r.date) : new Date();
    const dateStr = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-4 shadow-sm border border-med-100';
    card.innerHTML = '<div class="flex justify-between items-start mb-2"><div><p class="font-bold text-med-800">' + (icons[r.service_type]||'') + ' ' + (r.name||'-') + '</p><p class="text-xs text-med-400">' + (r.case_id||'-') + ' • ' + dateStr + '</p></div><span class="text-xs bg-med-100 text-med-700 px-2 py-1 rounded-lg">' + (labels[r.service_type]||r.service_type) + '</span></div><div class="text-sm text-gray-600 space-y-0.5"><p>👤 รหัส: ' + (r.student_id||'-') + ' | ห้อง: ' + (r.room||'-') + ' | อายุ: ' + (r.age||'-') + ' | เพศ: ' + (r.gender||'-') + '</p><p>📝 ' + (r.detail_summary||'-') + '</p><p>👨‍⚕️ ผู้ให้บริการ: ' + (r.provider||'-') + '</p></div><button class="mt-2 text-xs text-red-400 hover:text-red-600" data-del="true">🗑️ ลบ</button>';
    card.querySelector('[data-del]').addEventListener('click', () => openDeleteModal(r));
    list.appendChild(card);
  });
}

// ===== PROVIDERS =====
function renderProviders() {
  const list = document.getElementById('provider-list');
  list.innerHTML = '';
  providers.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 bg-med-50 rounded-xl px-3 py-2';
    row.innerHTML = `<span class="flex-1 text-sm text-med-800">${p}</span>
      <button class="text-red-400 hover:text-red-600 text-sm btn-press">✕</button>`;
    row.querySelector('button').addEventListener('click', () => removeProvider(p));
    list.appendChild(row);
  });
}

async function removeProvider(name) {
  const ok = await gsPost({ action: 'deleteProvider', name });
  if (ok) {
    providers = providers.filter(p => p !== name);
    renderProviders();
    showToast('ลบผู้ให้บริการสำเร็จ');
  } else {
    showError('ลบไม่สำเร็จ');
  }
}

async function addProvider() {
  const input = document.getElementById('new-provider');
  const name = input.value.trim();
  if (!name) return;
  if (providers.includes(name)) { showError('ชื่อนี้มีอยู่แล้ว'); return; }
  const ok = await gsPost({ action: 'addProvider', name });
  if (ok) {
    providers.push(name);
    input.value = '';
    renderProviders();
    showToast('เพิ่มผู้ให้บริการสำเร็จ');
  } else {
    showError('เพิ่มไม่สำเร็จ กรุณาลองใหม่');
  }
}

// Init
loadProviders().then(() => updateProviderDropdown());
lucide.createIcons();
