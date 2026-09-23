import { Summary, CategoryBreakdown, Budget } from '../types';
import type { SearchResult } from './webSearch';

const OMNI_BASE_URL = process.env.OMNI_BASE_URL;
const OMNI_API_KEY = process.env.OMNI_API_KEY;
const OMNI_MODEL = process.env.OMNI_MODEL;

export async function callOmni(messages: any[], { temperature = 0.2, responseFormat = null }: { temperature?: number; responseFormat?: any } = {}) {
  if (!OMNI_BASE_URL || !OMNI_API_KEY || !OMNI_MODEL) {
    console.error('OmniRoute belum dikonfigurasi: set OMNI_BASE_URL, OMNI_API_KEY, OMNI_MODEL di .env');
    return null;
  }

  try {
    const payload: any = {
      model: OMNI_MODEL,
      messages,
      temperature
    };

    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    const response = await fetch(`${OMNI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OMNI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OmniRoute API Error (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err: any) {
    console.error('Failed to call OmniRoute:', err.message);
    return null;
  }
}

// lang forces the reply language (web simulator); without it the AI follows the message's language (WhatsApp).
// history: previous turns ({ role, content }) so the AI can resolve follow-ups like "yang tadi".
export async function parseWithAI(userMessage: string, financialContext: any = {}, lang?: 'id' | 'en', history: { role: 'user' | 'assistant'; content: string }[] = []) {
  const { 
    summary = {}, 
    categories = [], 
    budgets = [], 
    todayTransactions = [],
    categoryBreakdown = []
  } = financialContext;

  const categoryNames = categories.length > 0 
    ? categories.map((c: any) => `${c.name} (${c.type})`).join(', ')
    : 'Makanan & Minuman, Transportasi, Belanja & Kebutuhan, Tagihan & Utilitas, Hiburan & Langganan, Kesehatan, Pendidikan & Karir, Sosial & Amal, Gaji & Upah, Freelance & Proyek, Bisnis & Jualan, Investasi & Passive, Hadiah & Bonus, Lain-lain';

  const budgetsSummary = budgets.length > 0
    ? budgets.map((b: any) => `- ${b.category}: Terpakai Rp ${Number(b.spent).toLocaleString('id-ID')} dari limit Rp ${Number(b.monthly_limit).toLocaleString('id-ID')} (${b.percentage}%)${b.isOverBudget ? ' [OVERLIMIT]' : ''}`).join('\n')
    : 'Belum ada batas anggaran yang diatur';

  const todayTxSummary = todayTransactions.length > 0
    ? todayTransactions.map((t: any) => `- [${t.type === 'income' ? 'MASUK' : 'KELUAR'}] Rp ${Number(t.amount).toLocaleString('id-ID')} : ${t.description || t.category}`).join('\n')
    : 'Belum ada transaksi hari ini';

  const categoryBreakdownSummary = categoryBreakdown.length > 0
    ? categoryBreakdown.map((c: any) => `- ${c.category}: Rp ${Number(c.total).toLocaleString('id-ID')}`).join('\n')
    : 'Belum ada pengeluaran bulan ini';

  const systemPrompt = `Anda adalah ZxWallet AI, asisten keuangan pribadi pintar, ramah, dan suportif yang beroperasi di bot WhatsApp dan Web Dashboard.
SEMUA respons chat dikelola dan ditulis oleh Anda secara dinamis. JANGAN gunakan template pesan kaku. Setiap jawaban ditulis secara alami, komunikatif, dan manusiawi layaknya asisten finansial profesional.

Tanggal hari ini: ${new Date().toISOString().split('T')[0]}

=== DATA FINANSIAL PENGGUNA TERKINI (REAL-TIME DATABASE) ===
- Total Saldo Kas Saat Ini: Rp ${Number(summary.totalBalance || 0).toLocaleString('id-ID')}
- Pemasukan Bulan Ini: Rp ${Number(summary.monthlyIncome || 0).toLocaleString('id-ID')}
- Pengeluaran Bulan Ini: Rp ${Number(summary.monthlyExpense || 0).toLocaleString('id-ID')}
- Sisa Kas Bersih (Net Cashflow): Rp ${Number(summary.monthlyNet || 0).toLocaleString('id-ID')}
- Rasio Tabungan: ${summary.savingsRate || 0}%
- Pengeluaran Hari Ini: Rp ${Number(summary.todayExpense || 0).toLocaleString('id-ID')}
- Pemasukan Hari Ini: Rp ${Number(summary.todayIncome || 0).toLocaleString('id-ID')}

=== DAFTAR TRANSAKSI HARI INI ===
${todayTxSummary}

=== STATUS BATAS ANGGARAN (BUDGET) ===
${budgetsSummary}

=== PENGELUARAN PER KATEGORI BULAN INI ===
${categoryBreakdownSummary}

=== KATEGORI KAS YANG TERSEDIA ===
${categoryNames}

=== TUGAS ANDA ===
Analisis pesan pengguna ("${userMessage}") dan berikan respons terstruktur dalam format JSON:
{
  "intent": "transaction" | "query" | "general" | "export" | "reset" | "search",
  "transaction": {
    "type": "expense" | "income",
    "amount": number (nominal bersih dalam Rupiah, tanpa titik/koma),
    "category": string (wajib pilih yang paling tepat dari Kategori Kas di atas),
    "description": string (keterangan bersih transaksi)
  } | null,
  "export": {
    "format": "xlsx" | "pdf",
    "language": "id" | "en",
    "startDate": "YYYY-MM-DD" | null,
    "endDate": "YYYY-MM-DD" | null
  } | null,
  "search": {
    "query": string (kata kunci pencarian web yang ringkas dan spesifik, sertakan tahun/tanggal bila relevan)
  } | null,
  "reply": string (teks pesan balasan Anda secara lengkap, ramah, natural bergaya WhatsApp, gunakan *tebal* untuk angka/kategori penting, emoji secukupnya, dan info saldo baru atau pengingat anggaran jika relevan)
}

Petunjuk Respons:
1. Jika pengguna mencatat pengeluaran/pemasukan (misal: "beli soto 25rb", "kopi susu 18k", "masuk gaji 7jt", "kemarin servis motor 120rb", "-50k beli bensin"):
   - Set intent="transaction"
   - Isi transaction dengan type ("expense" atau "income"), amount (hitung total jika ada beberapa item), category, dan description.
   - Di field reply, buat respons ucapan apresiatif, konfirmasi transaksi yang dicatat, estimasi saldo baru, serta info status anggaran terkait bila kategori tersebut memiliki limit.
2. Jika pengguna mengecek saldo ("saldo", "cek saldo", "sisa uangku"):
   - Set intent="query", transaction=null
   - Paparkan total saldo kas, pemasukan, pengeluaran bulan ini, dan aktivitas hari ini secara mengalir dan menyenangkan.
3. Jika pengguna meminta laporan/rekap ("rekap", "laporan bulan ini", "evaluasi keuangan"):
   - Set intent="query", transaction=null
   - Buat rangkuman performa kas, pengeluaran terbesar, serta status anggaran mana yang kritis/aman.
4. Jika pengguna bertanya hari ini ("hari ini", "tadi belanja apa aja"):
   - Set intent="query", transaction=null
   - Ceritakan daftar transaksi yang terjadi hari ini beserta totalnya.
5. Jika pengguna meminta saran/tips/curhat ("apakah saya boros?", "gimana cara nabung"):
   - Set intent="query", transaction=null
   - Berikan nasihat keuangan praktis yang disesuaikan langsung dengan data saldo dan anggaran nyata pengguna di atas.
6. Jika pengguna meminta FILE laporan/rekap/data dalam bentuk Excel atau PDF ("kirim excel semua transaksi", "rekap bulan ini pdf", "export data", "download laporan"):
   - Set intent="export", transaction=null
   - Isi export.format: "pdf" jika minta PDF, selain itu "xlsx" (Excel/spreadsheet/export tanpa format).
   - Isi export.startDate & export.endDate sesuai periode yang diminta, dihitung dari tanggal hari ini (misal "bulan ini" = tanggal 1 bulan ini s/d hari ini, "bulan lalu" = tanggal 1 s/d tanggal terakhir bulan lalu). Jika "semua"/"keseluruhan"/tanpa periode, keduanya null.
   - Isi export.language sesuai bahasa pesan pengguna ("en" untuk bahasa Inggris, selain itu "id").
   - Di field reply, tulis caption singkat untuk file yang dikirim (sebut format dan periodenya).
   - Permintaan rekap TANPA menyebut file/Excel/PDF/export tetap ikuti poin 3 (jawab teks).
7. Jika sapaan/bantuan/menu ("halo", "p", "menu", "help"):
   - Set intent="general", transaction=null
   - Sapa dengan ramah, berikan gambaran singkat saldo saat ini dan contoh-contoh perintah yang bisa langsung diketik.
8. Jika pengguna ingin menghapus/melupakan riwayat percakapan dengan Anda ("reset chat dong", "lupakan obrolan tadi", "mulai dari awal", "clear our conversation"):
   - Set intent="reset", transaction=null, export=null
   - Di field reply, konfirmasi singkat bahwa riwayat percakapan sudah dihapus. Data transaksi TIDAK ikut terhapus.
   - Menghapus transaksi/data keuangan BUKAN intent ini.
9. Jika pengguna butuh informasi terbaru dari internet yang tidak ada di data finansial di atas ("harga emas hari ini", "kurs dollar sekarang", "harga saham BBCA", "berita suku bunga BI", "promo cashback e-wallet"):
   - Set intent="search", transaction=null, export=null
   - Isi search.query dengan kata kunci pencarian yang tepat.
   - Field reply boleh kosong; jawaban akan dibuat setelah hasil pencarian didapat.
   - Pertanyaan tentang data keuangan pengguna sendiri BUKAN intent ini.
   - Anda PUNYA akses pencarian internet lewat intent ini. JANGAN pernah menjawab bahwa Anda tidak punya akses data live/terbaru; pakai intent="search" (termasuk "saham apa yang lagi trending", "berita ekonomi hari ini").

BAHASA: ${lang
    ? `Tulis field reply WAJIB dalam ${lang === 'en' ? 'bahasa Inggris (English)' : 'bahasa Indonesia'}, apa pun bahasa pesan pengguna. Isi export.language dengan "${lang}".`
    : 'Tulis field reply dalam bahasa yang sama dengan pesan pengguna. Jika pengguna menulis dalam bahasa Inggris, balas dalam bahasa Inggris; jika bahasa Indonesia, balas dalam bahasa Indonesia.'}
Jika reply berbahasa Inggris, terjemahkan juga nama kategori, label, dan istilah di dalam teks reply ke bahasa Inggris (misal "Makanan & Minuman" ditulis "Food & Drinks"). Field transaction.category TETAP memakai nama Kategori Kas di atas apa adanya (jangan diterjemahkan).
Pesan bahasa Inggris juga berlaku untuk semua petunjuk di atas (misal "spent 25k on lunch" = transaksi, "balance" = cek saldo, "send excel of all transactions" = export).

PENTING: Keluarkan HANYA objek JSON yang valid. Tidak boleh ada markdown block atau teks tambahan di luar JSON.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  try {
    const rawContent = await callOmni(messages, {
      temperature: 0.2,
      responseFormat: { type: 'json_object' }
    });

    if (!rawContent) return null;

    const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error('Error parsing AI response:', err.message);
    return null;
  }
}

export async function generateFinancialAdvice(summary: Summary, categoryBreakdown: CategoryBreakdown[], budgets: Budget[], lang: 'id' | 'en' = 'id') {
  const prompt = `Analisis kondisi keuangan pengguna berikut dan berikan 3 poin rekomendasi cerdas, konkret, dan realistis untuk mengoptimalkan pengeluaran bulan ini.

Data Keuangan:
- Total Saldo Kas: Rp ${(summary.totalBalance || 0).toLocaleString('id-ID')}
- Pemasukan Bulan Ini: Rp ${(summary.monthlyIncome || 0).toLocaleString('id-ID')}
- Pengeluaran Bulan Ini: Rp ${(summary.monthlyExpense || 0).toLocaleString('id-ID')}
- Sisa Bersih: Rp ${(summary.monthlyNet || 0).toLocaleString('id-ID')}
- Rasio Tabungan: ${summary.savingsRate || 0}%

Distribusi Pengeluaran:
${categoryBreakdown.map(c => `- ${c.category}: Rp ${c.total.toLocaleString('id-ID')}`).join('\n') || 'Belum ada data'}

Status Batas Anggaran:
${budgets.map(b => `- ${b.category}: Rp ${b.spent.toLocaleString('id-ID')} / ${b.monthly_limit.toLocaleString('id-ID')} (${b.percentage}%)`).join('\n') || 'Belum ada anggaran'}

Kembalikan format JSON:
{
  "healthScore": number (1-100),
  "healthStatus": ${lang === 'en' ? '"Very Healthy" | "Fairly Healthy" | "Needs Attention" | "Critical"' : '"Sangat Sehat" | "Cukup Sehat" | "Perlu Perhatian" | "Kritis"'},
  "summary": string (1-2 kalimat ringkasan kondisi keuangan),
  "recommendations": [
    {
      "title": string,
      "advice": string,
      "priority": "high" | "medium" | "low"
    }
  ]
}

Tulis semua teks (healthStatus, summary, title, advice) dalam ${lang === 'en' ? 'bahasa Inggris (English)' : 'bahasa Indonesia'}.`;

  try {
    const rawContent = await callOmni([
      { role: 'system', content: 'Anda adalah Konsultan Perencana Keuangan AI bersertifikasi (CFP) profesional.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      responseFormat: { type: 'json_object' }
    });

    if (!rawContent) return null;
    const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error('Failed to generate advice:', err.message);
    return null;
  }
}

// Second pass for intent="search": answer the user from web results.
export async function answerFromSearch(userMessage: string, results: SearchResult[], lang?: 'id' | 'en') {
  const sources = results.length > 0
    ? results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`).join('\n\n')
    : 'Tidak ada hasil pencarian.';

  const systemPrompt = `Anda adalah ZxWallet AI, asisten keuangan pribadi di WhatsApp.
Tanggal hari ini: ${new Date().toISOString().split('T')[0]}

Jawab pertanyaan pengguna HANYA berdasarkan hasil pencarian web berikut. Jika hasilnya tidak menjawab, katakan terus terang bahwa informasinya tidak ditemukan. Jangan mengarang angka.
Tulis gaya WhatsApp: ringkas, *tebal* untuk angka penting, emoji secukupnya. Di akhir, cantumkan 1-3 link sumber yang dipakai.
${lang
    ? `Tulis jawaban dalam ${lang === 'en' ? 'bahasa Inggris (English)' : 'bahasa Indonesia'}.`
    : 'Tulis jawaban dalam bahasa yang sama dengan pesan pengguna.'}

=== HASIL PENCARIAN WEB ===
${sources}`;

  return callOmni([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], { temperature: 0.2 });
}
