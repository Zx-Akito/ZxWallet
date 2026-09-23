import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as repo from './financeRepo';
import { Transaction } from '../types';

export type ExportFormat = 'xlsx' | 'pdf';

export interface ExportRequest {
  format: ExportFormat;
  startDate?: string | null; // YYYY-MM-DD, null = from the beginning
  endDate?: string | null; // YYYY-MM-DD, null = until today
}

export interface ExportFile {
  buffer: Buffer;
  fileName: string;
  mimetype: string;
}

function collect(userId: number | null, startDate?: string | null, endDate?: string | null) {
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
    ? `${startDate || 'awal'} s/d ${endDate || 'sekarang'}`
    : 'Semua data';

  return { items, income, expense, net: income - expense, categories, period };
}

const typeLabel = (type: string) => (type === 'income' ? 'Pemasukan' : 'Pengeluaran');

async function buildXlsx(data: ReturnType<typeof collect>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const money = '"Rp"#,##0';

  const summary = wb.addWorksheet('Ringkasan');
  summary.columns = [{ width: 28 }, { width: 22 }];
  summary.addRow(['Laporan Keuangan ZxWallet']).font = { bold: true, size: 14 };
  summary.addRow(['Periode', data.period]);
  summary.addRow([]);
  summary.addRow(['Total Pemasukan', data.income]);
  summary.addRow(['Total Pengeluaran', data.expense]);
  summary.addRow(['Selisih (Net)', data.net]).font = { bold: true };
  summary.addRow(['Jumlah Transaksi', data.items.length]);
  [4, 5, 6].forEach((r) => (summary.getCell(`B${r}`).numFmt = money));

  summary.addRow([]);
  const catHeader = summary.addRow(['Kategori', 'Total', 'Jenis', 'Jumlah']);
  catHeader.font = { bold: true };
  summary.getColumn(3).width = 14;
  summary.getColumn(4).width = 10;
  for (const c of data.categories) {
    summary.addRow([c.category, c.total, typeLabel(c.type), c.count]).getCell(2).numFmt = money;
  }

  const tx = wb.addWorksheet('Transaksi');
  tx.columns = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Jenis', key: 'type', width: 14 },
    { header: 'Kategori', key: 'category', width: 24 },
    { header: 'Keterangan', key: 'description', width: 40 },
    { header: 'Nominal', key: 'amount', width: 16, style: { numFmt: money } },
    { header: 'Sumber', key: 'source', width: 14 }
  ];
  tx.getRow(1).font = { bold: true };
  tx.views = [{ state: 'frozen', ySplit: 1 }];
  for (const t of data.items) {
    tx.addRow({ ...t, type: typeLabel(t.type), description: t.description || '' });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

function buildPdf(data: ReturnType<typeof collect>): Buffer {
  const doc = new jsPDF();
  const rp = (n: number) => repo.formatRupiah(n);

  doc.setFontSize(16);
  doc.text('Laporan Keuangan ZxWallet', 14, 18);
  doc.setFontSize(10);
  doc.text(`Periode: ${data.period}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    theme: 'plain',
    body: [
      ['Total Pemasukan', rp(data.income)],
      ['Total Pengeluaran', rp(data.expense)],
      ['Selisih (Net)', rp(data.net)],
      ['Jumlah Transaksi', String(data.items.length)]
    ],
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['Kategori', 'Jenis', 'Jumlah', 'Total']],
    body: data.categories.map((c) => [c.category, typeLabel(c.type), String(c.count), rp(c.total)]),
    headStyles: { fillColor: [16, 185, 129] },
    columnStyles: { 3: { halign: 'right' } }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal']],
    body: data.items.map((t) => [t.date, typeLabel(t.type), t.category, t.description || '', rp(t.amount)]),
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right' } }
  });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function buildReport(userId: number | null, req: ExportRequest): Promise<ExportFile> {
  const data = collect(userId, req.startDate, req.endDate);
  const stamp = new Date().toISOString().split('T')[0];

  if (req.format === 'pdf') {
    return {
      buffer: buildPdf(data),
      fileName: `laporan-zxwallet-${stamp}.pdf`,
      mimetype: 'application/pdf'
    };
  }
  return {
    buffer: await buildXlsx(data),
    fileName: `laporan-zxwallet-${stamp}.xlsx`,
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}
