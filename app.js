const drugListEl = document.querySelector('#drugList');
const searchEl = document.querySelector('#search');
const lotEl = document.querySelector('#lot');
const expEl = document.querySelector('#exp');
const sizeEl = document.querySelector('#size');
const qtyMedEl = document.querySelector('#qtyMed');
const addBtn = document.querySelector('#addSel');
const clearBtn = document.querySelector('#clearSel');
const printSelectedBtn = document.querySelector('#printSelectedBtn');
const closeBtn = document.querySelector('#closeBtn');
const printArea = document.querySelector('#printArea');

let ITEMS = [];

async function loadData(){
  const res = await fetch('data.json');
  const data = await res.json();
  ITEMS = data.components;
  renderList(ITEMS);
}
function renderList(list){
  drugListEl.innerHTML = '';
  list.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'drug-item';
    row.innerHTML = `
      <input type="checkbox" id="d${idx}"
        data-name="${escapeAttr(it.name)}"
        data-unit="${escapeAttr(it.unit || '')}"
        data-location="${escapeAttr(it.location || '')}">
      <label for="d${idx}" style="flex:1">${it.name}</label>
      <small style="color:#666">${it.unit ? '('+it.unit+')' : ''}</small>
    `;
    drugListEl.appendChild(row);
  });
}
function escapeAttr(s){ return (s||'').replaceAll('"','&quot;'); }

function toThaiDate(exp) {
  if (!exp) return '';
  const d = new Date(exp);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

searchEl.addEventListener('input', () => {
  const term = searchEl.value.toLowerCase().trim();
  const filtered = ITEMS.filter(n => n.name.toLowerCase().includes(term));
  renderList(filtered);
});

addBtn.addEventListener('click', () => {
  const selected = [...drugListEl.querySelectorAll('input[type="checkbox"]:checked')];
  if (selected.length === 0) {
    alert('กรุณาเลือกยาอย่างน้อย 1 รายการ');
    return;
  }
  const lot = lotEl.value.trim();
  const expDisplay = toThaiDate(expEl.value);
  const size = sizeEl.value;
  const qtyMed = Math.max(1, parseInt(qtyMedEl.value || '1', 10));

  selected.forEach(chk => {
    const name = chk.getAttribute('data-name');
    const unit = chk.getAttribute('data-unit') || '';
    const location = chk.getAttribute('data-location') || '';
    addSticker({ name, unit, location, lot, exp: expDisplay, size, qtyMed });
    chk.checked = false;
  });
  printArea.scrollIntoView({behavior:'smooth'});
});

function addSticker({ name, unit, location, lot, exp, size, qtyMed }){
  const div = document.createElement('div');
  div.className = 'sticker ' + (size === 'large' ? 'size-large' : '');
  const qtyLine = unit ? `${qtyMed} ${unit}` : `${qtyMed}`;
  div.innerHTML = `
    <div class="toolbar no-print">
      <button class="ghost" onclick="this.closest('.sticker').remove()">ลบ</button>
      <button class="accent" onclick="printOnlySticker(this.closest('.sticker'))">พิมพ์ดวงนี้</button>
      <input type="checkbox" class="pick" title="เลือกเพื่อพิมพ์เฉพาะที่เลือก">
    </div>
    ${location ? `<div class="loc">${escapeHtml(location)}</div>` : ''}
    <div class="drug">${escapeHtml(name)}</div>
    <div class="row">Lot: ${escapeHtml(lot || '')}</div>
    <div class="row">Exp: ${escapeHtml(exp || '')}</div>
    <div class="row">${escapeHtml(qtyLine)}</div>
  `;
  printArea.appendChild(div);
}

clearBtn.addEventListener('click', () => { printArea.innerHTML = ''; });

printSelectedBtn.addEventListener('click', () => {
  const chosen = [...printArea.querySelectorAll('.sticker .pick:checked')].map(cb => cb.closest('.sticker'));
  if (chosen.length === 0) {
    alert('ติ๊กเลือกสติกเกอร์ก่อน');
    return;
  }
  printStickersInNewWindow(chosen);
});

closeBtn.addEventListener('click', () => { window.close(); });

function escapeHtml(str) {
  return (str || '').toString()
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function printOnlySticker(stickerEl){ printStickersInNewWindow([stickerEl]); }

function printStickersInNewWindow(stickers){
  const win = window.open('', '_blank');
  const cssHref = 'styles.css';
  win.document.write(`<!doctype html>
<html><head>
<meta charset="utf-8">
<title>Print Stickers</title>
<link rel="stylesheet" href="${cssHref}">
<style>
@page { margin: 0; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body class="print-root">
<div class="print-grid" id="area"></div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`);
  const area = win.document.getElementById('area');
  stickers.forEach(s => {
    const clone = s.cloneNode(true);
    clone.querySelectorAll('.toolbar').forEach(el=>el.remove());
    area.appendChild(clone);
  });
  setTimeout(()=>{ try{ win.focus(); }catch(e){} }, 50);
}

loadData();