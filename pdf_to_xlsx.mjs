// Danisan_Listesi.pdf -> Danisan_Listesi.xlsx
// PDF sabit sutunlu bir tablo; metin parcalarini x koordinatina gore sutunlara dagitiyoruz.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import XLSX from 'xlsx';
import fs from 'node:fs';

const COLS = [
  { key: 'ID', x: 23 },
  { key: 'Ad', x: 65 },
  { key: 'Telefon', x: 173 },
  { key: 'E-Posta', x: 249 },
  { key: 'Segment', x: 381 },
  { key: 'Satis tems.', x: 473 },
  { key: 'Tip', x: 547 },
  { key: 'Ulke', x: 595 },
  { key: 'Dil', x: 659 },
  { key: 'Referans', x: 705 },
  { key: 'Kayit tarihi', x: 767 },
];

// Sutun sinirlari: iki sutunun ortasi
const BOUNDS = COLS.map((c, i) =>
  i === 0 ? -Infinity : (COLS[i - 1].x + c.x) / 2
);

const colIndexFor = (x) => {
  let idx = 0;
  for (let i = 0; i < COLS.length; i++) if (x >= BOUNDS[i]) idx = i;
  return idx;
};

const data = new Uint8Array(fs.readFileSync('Danisan_Listesi.pdf'));
const pdf = await getDocument({ data, useSystemFonts: true }).promise;

const rows = [];
const truncated = new Map(); // "sutun|deger" -> adet

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p);
  const tc = await page.getTextContent();

  // Ayni satirdaki parcalari y'ye gore grupla
  const byY = new Map();
  for (const it of tc.items) {
    if (!it.str.trim()) continue;
    const y = Math.round(it.transform[5]);
    const key = [...byY.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
    if (!byY.has(key)) byY.set(key, []);
    byY.get(key).push({ x: it.transform[4], s: it.str });
  }

  for (const [y, items] of [...byY.entries()].sort((a, b) => b[0] - a[0])) {
    items.sort((a, b) => a.x - b.x);
    const cells = COLS.map(() => []);
    for (const it of items) cells[colIndexFor(it.x)].push(it.s);

    const row = {};
    COLS.forEach((c, i) => { row[c.key] = cells[i].join(' ').replace(/\s+/g, ' ').trim(); });

    // Baslik / ustbilgi satirlarini ele
    if (!/^\d+$/.test(row.ID)) continue;

    for (const c of COLS) {
      const v = row[c.key];
      if (v && /…|\.\.\.$/.test(v)) {
        const k = `${c.key}|${v}`;
        truncated.set(k, (truncated.get(k) ?? 0) + 1);
      }
    }
    rows.push(row);
  }
  if (p % 40 === 0) console.log(`  ...sayfa ${p}/${pdf.numPages}`);
}

console.log(`\nToplam satir: ${rows.length}`);

const uniq = new Map();
for (const r of rows) if (!uniq.has(r.ID)) uniq.set(r.ID, r);
if (uniq.size !== rows.length) console.log(`Mukerrer ID: ${rows.length - uniq.size}`);

const ws = XLSX.utils.json_to_sheet([...uniq.values()], { header: COLS.map((c) => c.key) });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Danisanlar');
XLSX.writeFile(wb, 'Danisan_Listesi.xlsx');
console.log('Yazildi: Danisan_Listesi.xlsx');

console.log('\n=== KIRPILMIS (…) DEGERLER ===');
const tr = [...truncated.entries()].sort((a, b) => b[1] - a[1]);
if (!tr.length) console.log('(yok)');
for (const [k, n] of tr) console.log(`${String(n).padStart(5)}  ${k}`);

// Sutun bazli benzersiz deger ozetleri (eslemeyi dogrulamak icin)
for (const key of ['Segment', 'Referans', 'Dil', 'Tip', 'Satis tems.']) {
  const m = new Map();
  for (const r of uniq.values()) {
    const v = r[key] || '(bos)';
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  console.log(`\n=== ${key} (${m.size} farkli) ===`);
  for (const [v, n] of [...m.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`${String(n).padStart(5)}  ${v}`);
}
