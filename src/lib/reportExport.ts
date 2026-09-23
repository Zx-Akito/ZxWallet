import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as repo from './financeRepo';
import { Transaction } from '../types';
import { Lang, translateCategory } from './i18n';

const LABELS = {
  id: {
    title: 'Laporan Keuangan ZxWallet', period: 'Periode', all: 'Semua data', from: 'awal', to: 'sekarang', until: 's/d',
    income: 'Total Pemasukan', expense: 'Total Pengeluaran', net: 'Selisih (Net)', count: 'Jumlah Transaksi',
    category: 'Kategori', total: 'Total', type: 'Jenis', qty: 'Jumlah', date: 'Tanggal', desc: 'Keterangan',
    amount: 'Nominal', source: 'Sumber', inc: 'Pemasukan', exp: 'Pengeluaran',
    summarySheet: 'Ringkasan', txSheet: 'Transaksi', file: 'laporan'
  },
  en: {
    title: 'ZxWallet Financial Report', period: 'Period', all: 'All data', from: 'start', to: 'now', until: 'to',
    income: 'Total Income', expense: 'Total Expenses', net: 'Net', count: 'Transactions',
    category: 'Category', total: 'Total', type: 'Type', qty: 'Count', date: 'Date', desc: 'Description',
    amount: 'Amount', source: 'Source', inc: 'Income', exp: 'Expense',
    summarySheet: 'Summary', txSheet: 'Transactions', file: 'report'
  }
};
type Labels = typeof LABELS.id;

export type ExportFormat = 'xlsx' | 'pdf';

export interface ExportRequest {
  format: ExportFormat;
  lang?: Lang;
  startDate?: string | null; // YYYY-MM-DD, null = from the beginning
  endDate?: string | null; // YYYY-MM-DD, null = until today
}

export interface ExportFile {
  buffer: Buffer;
  fileName: string;
  mimetype: string;
}

function collect(userId: number | null, L: Labels, startDate?: string | null, endDate?: string | null) {
  const items: Transaction[] = repo.getTransactions({
    user_id: userId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: -1 // SQLite: no limit
  }).items;

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, { type: string; total: number; count: number }>();
  for (const t of items) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
    const key = `${t.type}|${t.category}`;
    const row = byCategory.get(key) || { type: t.type, total: 0, count: 0 };
    row.total += t.amount;
    row.count += 1;
    byCategory.set(key, row);
  }

  const categories = [...byCategory.entries()]
    .map(([key, v]) => ({ category: key.split('|')[1], ...v }))
    .sort((a, b) => b.total - a.total);

  const period = startDate || endDate
    ? `${startDate || L.from} ${L.until} ${endDate || L.to}`
    : L.all;

  return { items, income, expense, net: income - expense, categories, period };
}


async function buildXlsx(data: ReturnType<typeof collect>, L: Labels, lang: Lang): Promise<Buffer> {
  const typeLabel = (type: string) => (type === 'income' ? L.inc : L.exp);
  const wb = new ExcelJS.Workbook();
  const money = '"Rp"#,##0';

  const summary = wb.addWorksheet(L.summarySheet);
  summary.columns = [{ width: 28 }, { width: 22 }];
  summary.addRow([L.title]).font = { bold: true, size: 14 };
  summary.addRow([L.period, data.period]);
  summary.addRow([]);
  summary.addRow([L.income, data.income]);
  summary.addRow([L.expense, data.expense]);
  summary.addRow([L.net, data.net]).font = { bold: true };
  summary.addRow([L.count, data.items.length]);
  [4, 5, 6].forEach((r) => (summary.getCell(`B${r}`).numFmt = money));

  summary.addRow([]);
  const catHeader = summary.addRow([L.category, L.total, L.type, L.qty]);
  catHeader.font = { bold: true };
  summary.getColumn(3).width = 14;
  summary.getColumn(4).width = 10;
  for (const c of data.categories) {
    summary.addRow([translateCategory(c.category, lang), c.total, typeLabel(c.type), c.count]).getCell(2).numFmt = money;
  }

  const tx = wb.addWorksheet(L.txSheet);
  tx.columns = [
    { header: L.date, key: 'date', width: 14 },
    { header: L.type, key: 'type', width: 14 },
    { header: L.category, key: 'category', width: 24 },
    { header: L.desc, key: 'description', width: 40 },
    { header: L.amount, key: 'amount', width: 16, style: { numFmt: money } },
    { header: L.source, key: 'source', width: 14 }
  ];
  tx.getRow(1).font = { bold: true };
  tx.views = [{ state: 'frozen', ySplit: 1 }];
  for (const t of data.items) {
    tx.addRow({ ...t, type: typeLabel(t.type), category: translateCategory(t.category, lang), description: t.description || '' });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

function buildPdf(data: ReturnType<typeof collect>, L: Labels, lang: Lang): Buffer {
  const typeLabel = (type: string) => (type === 'income' ? L.inc : L.exp);
  const cat = (name: string) => translateCategory(name, lang);
  const doc = new jsPDF();
  const rp = (n: number) => repo.formatRupiah(n);

  doc.setFontSize(16);
  doc.text(L.title, 14, 18);
  doc.setFontSize(10);
  doc.text(`${L.period}: ${data.period}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    theme: 'plain',
    body: [
      [L.income, rp(data.income)],
      [L.expense, rp(data.expense)],
      [L.net, rp(data.net)],
      [L.count, String(data.items.length)]
    ],
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [[L.category, L.type, L.qty, L.total]],
    body: data.categories.map((c) => [cat(c.category), typeLabel(c.type), String(c.count), rp(c.total)]),
    headStyles: { fillColor: [16, 185, 129] },
    columnStyles: { 3: { halign: 'right' } }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [[L.date, L.type, L.category, L.desc, L.amount]],
    body: data.items.map((t) => [t.date, typeLabel(t.type), cat(t.category), t.description || '', rp(t.amount)]),
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right' } }
  });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function buildReport(userId: number | null, req: ExportRequest): Promise<ExportFile> {
  const lang = req.lang || 'id';
  const L = LABELS[lang];
  const data = collect(userId, L, req.startDate, req.endDate);
  const stamp = new Date().toISOString().split('T')[0];

  if (req.format === 'pdf') {
    return {
      buffer: buildPdf(data, L, lang),
      fileName: `${L.file}-zxwallet-${stamp}.pdf`,
      mimetype: 'application/pdf'
    };
  }
  return {
    buffer: await buildXlsx(data, L, lang),
    fileName: `${L.file}-zxwallet-${stamp}.xlsx`,
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}
