import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'finance.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      icon TEXT,
      color TEXT,
      keywords TEXT,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      source TEXT DEFAULT 'whatsapp',
      sender_phone TEXT,
      sender_name TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT,
      message TEXT,
      response TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      history_key TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ai_history_key ON ai_history (history_key, id);
  `);

  // Migrate old categories table (global UNIQUE name) to per-user custom categories; user_id NULL = default.
  const categoryCols = db.prepare('PRAGMA table_info(categories)').all() as any[];
  if (!categoryCols.some((c) => c.name === 'user_id')) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE categories_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          icon TEXT,
          color TEXT,
          keywords TEXT,
          UNIQUE(user_id, name)
        );
        INSERT INTO categories_new (id, name, type, icon, color, keywords)
          SELECT id, name, type, icon, color, keywords FROM categories;
        DROP TABLE categories;
        ALTER TABLE categories_new RENAME TO categories;
      `);
    })();
  }

  // Seed default categories if empty
  const categoryCount = (db.prepare('SELECT count(*) as count FROM categories').get() as any).count;
  if (categoryCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, type, icon, color, keywords)
      VALUES (@name, @type, @icon, @color, @keywords)
    `);

    const defaultCategories = [
      {
        name: 'Makanan & Minuman',
        type: 'expense',
        icon: 'UtensilsCrossed',
        color: '#f97316',
        keywords: 'makan,nasi,ayam,kopi,boba,jajan,cafe,resto,restoran,burger,pizza,gofood,grabfood,shopeefood,indomaret,alfamart,sarapan,lunch,dinner,bakso,soto,mie,roti,es,minum'
      },
      {
        name: 'Transportasi',
        type: 'expense',
        icon: 'Car',
        color: '#3b82f6',
        keywords: 'bensin,pertalite,pertamax,spbu,ojol,gojek,grab,goride,gocar,grabride,grabcar,parkir,tol,krl,mrt,busway,tj,kereta,taksi,angkot'
      },
      {
        name: 'Belanja & Kebutuhan',
        type: 'expense',
        icon: 'ShoppingBag',
        color: '#ec4899',
        keywords: 'belanja,baju,sepatu,skincare,sabun,shopee,tokopedia,lazada,tiktok,supermarket,hypermart,pasar,mall,pakaian,celana'
      },
      {
        name: 'Tagihan & Utilitas',
        type: 'expense',
        icon: 'Receipt',
        color: '#8b5cf6',
        keywords: 'listrik,pln,token,air,pdam,wifi,indihome,telkom,pulsa,kuota,paket data,bpjs,pbb,sewa,kos,kontrakan,cicilan,asuransi'
      },
      {
        name: 'Hiburan & Langganan',
        type: 'expense',
        icon: 'Film',
        color: '#06b6d4',
        keywords: 'netflix,spotify,youtube,bioskop,cinema,game,steam,topup,mobile legend,ff,genshin,liburan,staycation,hotel,jalan,rekreasi'
      },
      {
        name: 'Kesehatan',
        type: 'expense',
        icon: 'HeartPulse',
        color: '#ef4444',
        keywords: 'obat,apotek,dokter,vitamin,rs,rumah sakit,klinik,periksa,medis,rapid,swab,laboratorium'
      },
      {
        name: 'Pendidikan & Karir',
        type: 'expense',
        icon: 'GraduationCap',
        color: '#10b981',
        keywords: 'buku,kursus,pelatihan,seminar,webinar,fotokopi,alat tulis,kuliah,spp,ujian'
      },
      {
        name: 'Sosial & Amal',
        type: 'expense',
        icon: 'HandHeart',
        color: '#14b8a6',
        keywords: 'sedekah,donasi,zakat,infaq,kondangan,sumbangan,amplop,orang tua,kado,hadiah'
      },
      {
        name: 'Lain-lain',
        type: 'expense',
        icon: 'HelpCircle',
        color: '#64748b',
        keywords: 'lain,keperluan,biaya,ongkos,denda'
      },
      {
        name: 'Gaji & Upah',
        type: 'income',
        icon: 'Briefcase',
        color: '#22c55e',
        keywords: 'gaji,payroll,salary,upah,honor,bulanan'
      },
      {
        name: 'Freelance & Proyek',
        type: 'income',
        icon: 'Laptop',
        color: '#10b981',
        keywords: 'freelance,proyek,project,sidejob,jasa,desain,coding,ngoding,klien,job'
      },
      {
        name: 'Bisnis & Jualan',
        type: 'income',
        icon: 'Store',
        color: '#eab308',
        keywords: 'jualan,bisnis,dagang,omset,profit,toko,closing,penjualan'
      },
      {
        name: 'Investasi & Passive',
        type: 'income',
        icon: 'TrendingUp',
        color: '#06b6d4',
        keywords: 'dividen,bunga,reksadana,saham,crypto,cuan,passive,imbal hasil,deposito'
      },
      {
        name: 'Hadiah & Bonus',
        type: 'income',
        icon: 'Gift',
        color: '#f59e0b',
        keywords: 'bonus,thr,hadiah,angpao,cashback,refund,tips'
      },
      {
        name: 'Pemasukan Lain',
        type: 'income',
        icon: 'Coins',
        color: '#6366f1',
        keywords: 'pemasukan,masuk,transferan,kiriman'
      }
    ];

    const insertMany = db.transaction((categories: any[]) => {
      for (const cat of categories) insertCat.run(cat);
    });
    insertMany(defaultCategories);
  }

  // Ensure unassigned seed data is cleared
  try {
    db.exec(`
      DELETE FROM transactions WHERE user_id IS NULL;
      DELETE FROM budgets WHERE user_id IS NULL;
    `);
  } catch (e) {}
}

initDatabase();

export default db;
