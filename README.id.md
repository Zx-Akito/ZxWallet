# ZxWallet

[English](README.md) | **Bahasa Indonesia**

Bot WhatsApp pencatat keuangan pribadi berbasis AI. Catat pemasukan dan pengeluaran lewat chat santai, cek saldo dan anggaran, lalu minta rekap Excel/PDF yang langsung dikirim di WhatsApp. Dilengkapi dashboard web (bisa di-install sebagai PWA) yang menampilkan grafik dan analisis AI.

## Fitur

- **Catat lewat chat.** Kirim pesan seperti `beli kopi susu 18k` atau `masuk gaji 7jt`. AI membaca nominal, jenis, dan kategorinya, lalu mencatat transaksi.
- **Saldo dan ringkasan.** Tanya saldo, transaksi hari ini, atau rekap bulanan dengan bahasa biasa.
- **Export Excel/PDF.** Minta file, misalnya `kirim excel semua transaksi` atau `rekap bulan ini pdf`, dan bot mengirimnya sebagai dokumen WhatsApp.
- **Anggaran.** Atur batas bulanan per kategori dan pantau berapa yang sudah terpakai.
- **Dashboard web.** Lihat transaksi, grafik, anggaran, dan skor kesehatan keuangan dari AI. Ada juga simulator chat untuk mencoba bot tanpa WhatsApp.
- **Akun.** Pendaftaran memakai OTP yang dikirim lewat WhatsApp. Dashboard wajib login.

## Teknologi

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · SQLite (better-sqlite3) · Baileys (WhatsApp Web) · Zustand · Recharts · ExcelJS · jsPDF

AI dipanggil lewat endpoint `/chat/completions` yang kompatibel dengan OpenAI, diatur lewat `OMNI_BASE_URL`.

## Cara menjalankan

Kebutuhan: Node.js 20 atau lebih baru, dan satu akun WhatsApp untuk dijadikan bot.

```sh
npm install
cp .env.example .env   # lalu isi nilainya
npm run dev
```

Buka http://localhost:3000, login, masuk ke tab **Bot WA**, lalu scan QR code dengan WhatsApp (**Perangkat tertaut**).

Untuk production:

```sh
npm run build
npm start
```

## Konfigurasi

| Variabel | Keterangan |
| --- | --- |
| `OMNI_BASE_URL` | Base URL API yang kompatibel dengan OpenAI, misalnya `https://host-kamu/v1` |
| `OMNI_API_KEY` | API key untuk endpoint tersebut |
| `OMNI_MODEL` | Nama model yang dipakai |
| `JWT_SECRET` | Secret untuk menandatangani token login. Pakai string acak yang panjang, misalnya dari `openssl rand -hex 32`. |

### Nomor pemilik bot

Bot hanya membalas satu nomor WhatsApp, dan hanya akun itu yang bisa mengatur koneksi WhatsApp. Nomor tersebut (`62895400233001`) saat ini tertulis langsung di kode. Untuk memakai nomormu sendiri, ganti nomor itu di:

- `src/lib/baileysService.ts`
- `src/app/api/wa/status/route.ts`
- `src/app/api/wa/logout/route.ts`
- `src/app/api/wa/restart/route.ts`
- `src/components/WhatsAppSection.tsx`

## Struktur project

```
src/app/            Halaman Next.js dan API route
src/components/     UI dashboard
src/lib/            Database, auth, AI, WhatsApp (Baileys), export laporan
server/botRunner.js Menyalakan koneksi WhatsApp dan mencatat statusnya
data/               Database SQLite (dibuat saat pertama jalan, di-ignore git)
auth_info_baileys/  Sesi WhatsApp (di-ignore git, jangan dibagikan)
```

## Catatan keamanan

- Jangan pernah commit `.env`, `data/`, atau `auth_info_baileys/`. Folder sesi memberi akses penuh ke akun WhatsApp yang tertaut.
- Baileys adalah klien WhatsApp Web tidak resmi. Pemakaiannya bisa melanggar ketentuan WhatsApp, jadi risiko ditanggung sendiri.
