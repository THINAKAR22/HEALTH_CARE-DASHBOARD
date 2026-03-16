/* ============================================================
   HEALTHWATCH — script.js
   All interactivity, charts, map, dummy data
============================================================ */

// ============================================================
// DUMMY DATA
// ============================================================
const districtData = {
  chennai_north:    { risk:'high',     cases:3450, icu:78, beds:210, advice:'Avoid crowded areas. Seek medical help if symptoms appear. ICU under strain — home isolation recommended for mild cases.' },
  chennai_south:    { risk:'moderate', cases:1820, icu:52, beds:430, advice:'Exercise caution. Wear masks in public transport and hospitals.' },
  mumbai_suburban:  { risk:'moderate', cases:2140, icu:71, beds:320, advice:'ICU near threshold. Hospitals operational but under load. Monitor closely.' },
  bengaluru_east:   { risk:'low',      cases:640,  icu:29, beds:890, advice:'Situation stable. Continue standard hygiene precautions.' },
  delhi_central:    { risk:'high',     cases:4210, icu:83, beds:185, advice:'High risk zone. Avoid non-essential outings. Emergency lines active.' },
  hyderabad_urban:  { risk:'moderate', cases:1560, icu:48, beds:510, advice:'Moderate load on healthcare. Vaccination drive ongoing.' },
  kolkata_north:    { risk:'low',      cases:480,  icu:22, beds:1040, advice:'Low risk. Health systems stable. Stay updated with advisories.' },
  pune_city:        { risk:'low',      cases:720,  icu:34, beds:760, advice:'Manageable situation. Contact PCMC helpline for guidance.' },
};

const tableData = [
  { city:'Chennai North',   state:'Tamil Nadu',     cases:3450, icu:78,  risk:'high' },
  { city:'Delhi Central',   state:'Delhi',          cases:4210, icu:83,  risk:'high' },
  { city:'Mumbai Suburban', state:'Maharashtra',    cases:2140, icu:71,  risk:'high' },
  { city:'Hyderabad Urban', state:'Telangana',      cases:1560, icu:48,  risk:'medium' },
  { city:'Chennai South',   state:'Tamil Nadu',     cases:1820, icu:52,  risk:'medium' },
  { city:'Lucknow',         state:'Uttar Pradesh',  cases:1290, icu:44,  risk:'medium' },
  { city:'Ahmedabad East',  state:'Gujarat',        cases:1070, icu:39,  risk:'medium' },
  { city:'Pune City',       state:'Maharashtra',    cases:720,  icu:34,  risk:'low' },
  { city:'Bengaluru East',  state:'Karnataka',      cases:640,  icu:29,  risk:'low' },
  { city:'Kolkata North',   state:'West Bengal',    cases:480,  icu:22,  risk:'low' },
  { city:'Bhopal',          state:'Madhya Pradesh', cases:390,  icu:18,  risk:'low' },
  { city:'Jaipur Central',  state:'Rajasthan',      cases:870,  icu:41,  risk:'medium' },
  { city:'Chandigarh',      state:'Punjab',         cases:320,  icu:16,  risk:'low' },
  { city:'Nagpur',          state:'Maharashtra',    cases:950,  icu:37,  risk:'medium' },
  { city:'Patna',           state:'Bihar',          cases:430,  icu:21,  risk:'low' },
];

// 30-day trend
function genTrend(base, noise, trend) {
  return Array.from({ length: 30 }, (_, i) => {
    const v = base + trend * i + (Math.random() - 0.5) * noise;
    return Math.max(0, Math.round(v));
  });
}
const labels30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
});
const casesData = genTrend(8000, 600, 170);
const recovData = genTrend(6500, 400, 120);
const deathData = genTrend(90,   20,  2);

const stateData = {
  labels: ['Tamil Nadu','Delhi','Maharashtra','Telangana','Karnataka','UP','Gujarat','West Bengal'],
  cases:  [5270, 4210, 4860, 1560, 640, 1290, 1070, 480],
};

// ============================================================
// LIVE DATE
// ============================================================
function updateDate() {
  const now = new Date();
  const str = now.toLocaleString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  document.getElementById('live-date').textContent = str;
  document.getElementById('live-date-admin').textContent = str;
}
updateDate();
setInterval(updateDate, 30000);

// ============================================================
// COUNTER ANIMATION
// ============================================================
function animateCounters(container) {
  const els = (container || document).querySelectorAll('.card-value[data-count]');
  els.forEach(el => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString('en-IN') + suffix;
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// ============================================================
// TREND CHART (Citizen)
// ============================================================
let trendChart;
let activeDataset = 'cases';
function initTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels30,
      datasets: [{
        label: 'Active Cases',
        data: casesData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 11 }, color: '#94a3b8' } },
        y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } }
      }
    }
  });
}

window.toggleChart = function(type, btn) {
  document.querySelectorAll('.tog').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const map = {
    cases:      { data: casesData, color: '#ef4444', label: 'Active Cases' },
    recoveries: { data: recovData, color: '#22c55e', label: 'Recoveries' },
    deaths:     { data: deathData, color: '#6366f1', label: 'Deaths' },
  };
  const d = map[type];
  trendChart.data.datasets[0].data = d.data;
  trendChart.data.datasets[0].borderColor = d.color;
  trendChart.data.datasets[0].backgroundColor = d.color.replace(')', ',0.1)').replace('rgb', 'rgba');
  trendChart.data.datasets[0].label = d.label;
  trendChart.update();
};

// ============================================================
// ADMIN CHARTS
// ============================================================
let barChart, doughnut;
function initAdminCharts() {
  // Bar chart
  const bc = document.getElementById('adminBarChart');
  if (bc && !barChart) {
    barChart = new Chart(bc, {
      type: 'bar',
      data: {
        labels: stateData.labels,
        datasets: [{
          label: 'Active Cases',
          data: stateData.cases,
          backgroundColor: [
            '#ef444499','#ef444499','#f97316aa','#eab30888',
            '#22c55e88','#6366f188','#3b82f688','#22c55e88'
          ],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8', maxRotation: 30 } },
          y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } }
        }
      }
    });
  }
  // Doughnut
  const dc = document.getElementById('adminDoughnut');
  if (dc && !doughnut) {
    doughnut = new Chart(dc, {
      type: 'doughnut',
      data: {
        labels: ['High Risk', 'Medium Risk', 'Low Risk'],
        datasets: [{
          data: [47, 183, 512],
          backgroundColor: ['#ef4444cc','#f97316cc','#22c55ecc'],
          borderWidth: 0,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 14 } },
        }
      }
    });
  }
}

// ============================================================
// LEAFLET MAP
// ============================================================
let mapInstance;
function initMap() {
  if (mapInstance) return;
  const mapEl = document.getElementById('indiaMap');
  if (!mapEl) return;

  mapInstance = L.map('indiaMap', { zoomControl: true, scrollWheelZoom: false }).setView([22.5, 80.5], 4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © Carto',
    maxZoom: 10,
  }).addTo(mapInstance);

  const districts = [
    { name:'Chennai North', lat:13.15, lng:80.29, risk:'high',   cases:3450, icu:78 },
    { name:'Delhi Central', lat:28.65, lng:77.22, risk:'high',   cases:4210, icu:83 },
    { name:'Mumbai Central',lat:19.07, lng:72.87, risk:'high',   cases:2140, icu:71 },
    { name:'Hyderabad',     lat:17.38, lng:78.49, risk:'medium', cases:1560, icu:48 },
    { name:'Bengaluru',     lat:12.97, lng:77.59, risk:'low',    cases:640,  icu:29 },
    { name:'Ahmedabad',     lat:23.03, lng:72.58, risk:'medium', cases:1070, icu:39 },
    { name:'Kolkata',       lat:22.57, lng:88.36, risk:'low',    cases:480,  icu:22 },
    { name:'Pune',          lat:18.52, lng:73.86, risk:'low',    cases:720,  icu:34 },
    { name:'Jaipur',        lat:26.91, lng:75.79, risk:'medium', cases:870,  icu:41 },
    { name:'Lucknow',       lat:26.85, lng:80.95, risk:'medium', cases:1290, icu:44 },
    { name:'Nagpur',        lat:21.15, lng:79.09, risk:'medium', cases:950,  icu:37 },
    { name:'Patna',         lat:25.59, lng:85.14, risk:'low',    cases:430,  icu:21 },
    { name:'Bhopal',        lat:23.26, lng:77.41, risk:'low',    cases:390,  icu:18 },
    { name:'Chandigarh',    lat:30.73, lng:76.78, risk:'low',    cases:320,  icu:16 },
    { name:'Visakhapatnam', lat:17.72, lng:83.30, risk:'medium', cases:810,  icu:36 },
  ];

  const colorMap = { high:'#ef4444', medium:'#f97316', low:'#22c55e' };

  districts.forEach(d => {
    const radius = 14000 + d.cases * 3;
    L.circle([d.lat, d.lng], {
      radius,
      color: colorMap[d.risk],
      fillColor: colorMap[d.risk],
      fillOpacity: 0.35,
      weight: 1.5,
    })
    .addTo(mapInstance)
    .bindTooltip(`
      <div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.5">
        <strong style="font-size:13px">${d.name}</strong><br>
        <span style="color:${colorMap[d.risk]};font-weight:700;text-transform:uppercase">${d.risk} Risk</span><br>
        Cases: <b>${d.cases.toLocaleString()}</b> &nbsp;|&nbsp; ICU: <b>${d.icu}%</b>
      </div>
    `, { sticky: true, opacity: 0.97 });
  });

  setTimeout(() => mapInstance.invalidateSize(), 200);
}

// ============================================================
// TABLE
// ============================================================
function buildTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = tableData.map(r => {
    const bedsUsed = Math.round(r.icu * (r.cases / 100));
    return `<tr>
      <td><strong>${r.city}</strong></td>
      <td>${r.state}</td>
      <td>${r.cases.toLocaleString('en-IN')}</td>
      <td>${bedsUsed}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${r.icu}%;background:${r.icu>=70?'#ef4444':r.icu>=45?'#f97316':'#22c55e'};border-radius:99px;transition:.3s"></div>
          </div>
          <span>${r.icu}%</span>
        </div>
      </td>
      <td><span class="risk-badge ${r.risk === 'medium' ? 'medium' : r.risk}">${r.risk === 'medium' ? 'Medium' : r.risk === 'high' ? 'High' : 'Low'}</span></td>
    </tr>`;
  }).join('');
}

window.filterTable = function(input) {
  const q = input.value.toLowerCase();
  document.querySelectorAll('#tableBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
};

// ============================================================
// VIEW / MODE SWITCHING
// ============================================================
let currentMode = 'citizen';

window.setMode = function(mode) {
  currentMode = mode;
  document.getElementById('btn-citizen').classList.toggle('active', mode === 'citizen');
  document.getElementById('btn-admin').classList.toggle('active', mode === 'admin');
  document.getElementById('citizen-view').classList.toggle('hidden', mode !== 'citizen');
  document.getElementById('admin-view').classList.toggle('hidden', mode !== 'admin');
  document.getElementById('citizen-topnav').classList.toggle('hidden', mode !== 'citizen');
  document.getElementById('admin-topnav').classList.toggle('hidden', mode !== 'admin');

  if (mode === 'admin') {
    setTimeout(() => {
      initAdminCharts();
      initMap();
      buildTable();
      animateCounters(document.getElementById('admin-view'));
    }, 50);
  }
};

window.switchView = function(view, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  if (view === 'citizen') { setMode('citizen'); return; }
  if (view === 'risk' || view === 'reports' || view === 'alerts' || view === 'upload') {
    setMode('admin');
  }
};

// ============================================================
// DISTRICT LOOKUP
// ============================================================
window.updateDistrictInfo = function() {
  const key = document.getElementById('districtSelect').value;
  const result = document.getElementById('districtResult');
  if (!key) { result.classList.add('hidden'); return; }
  const d = districtData[key];
  document.getElementById('drRisk').textContent = `Risk Level: ${d.risk.charAt(0).toUpperCase() + d.risk.slice(1)}`;
  document.getElementById('drRisk').className = `dr-risk ${d.risk}`;
  document.getElementById('drCases').textContent = d.cases.toLocaleString('en-IN');
  document.getElementById('drICU').textContent = d.icu + '%';
  document.getElementById('drBeds').textContent = d.beds.toLocaleString('en-IN');
  document.getElementById('drAdvice').textContent = d.advice;
  result.classList.remove('hidden');
};

// ============================================================
// SYMPTOM TOGGLES
// ============================================================
const symptoms = { fever: 'yes', cough: 'yes', breath: 'no', fatigue: 'no' };
window.toggleSym = function(btn, sym, val) {
  symptoms[sym] = val;
  const wrap = btn.parentElement;
  wrap.querySelectorAll('.sym-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

// ============================================================
// REPORT FORM SUBMIT
// ============================================================
window.submitReport = function(e) {
  e.preventDefault();
  const form = e.target;
  form.classList.add('hidden');
  document.getElementById('formSuccess').classList.remove('hidden');
  showToast('✅ Report submitted successfully. Thank you!');
  setTimeout(() => {
    form.classList.remove('hidden');
    document.getElementById('formSuccess').classList.add('hidden');
    form.reset();
  }, 5000);
};

// ============================================================
// RISK BANNER
// ============================================================
window.dismissBanner = function() {
  document.getElementById('risk-banner').style.display = 'none';
};

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
window.toggleSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
};

// ============================================================
// SCROLL TO
// ============================================================
window.scrollTo = function(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

// ============================================================
// MINI SPARKLINES (SVG)
// ============================================================
function drawSparkline(containerId, data, color) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const w = 100, h = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:100%">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
  </svg>`;
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  animateCounters();
  initTrendChart();
  drawSparkline('spark1', genTrend(300, 80, 30), '#ef4444');
  drawSparkline('spark2', genTrend(2, 1, 0.1), '#f97316');
  drawSparkline('spark3', genTrend(500, 60, -10), '#22c55e');
  drawSparkline('spark4', genTrend(80, 4, 0.2), '#3b82f6');
});
