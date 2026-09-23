import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'id' | 'en';

export const useLangStore = create<{ lang: Lang; setLang: (lang: Lang) => void }>()(
  persist((set) => ({ lang: 'id', setLang: (lang) => set({ lang }) }), { name: 'zxwallet_lang' })
);

// Default category names are stored in Indonesian in the DB; this maps them for display only.
const CATEGORY_EN: Record<string, string> = {
  'Makanan & Minuman': 'Food & Drinks',
  'Transportasi': 'Transportation',
  'Belanja & Kebutuhan': 'Shopping & Needs',
  'Tagihan & Utilitas': 'Bills & Utilities',
  'Hiburan & Langganan': 'Entertainment & Subscriptions',
  'Kesehatan': 'Health',
  'Pendidikan & Karir': 'Education & Career',
  'Sosial & Amal': 'Social & Charity',
  'Gaji & Upah': 'Salary & Wages',
  'Freelance & Proyek': 'Freelance & Projects',
  'Bisnis & Jualan': 'Business & Sales',
  'Investasi & Passive': 'Investments & Passive',
  'Hadiah & Bonus': 'Gifts & Bonuses',
  'Pemasukan Lain': 'Other Income',
  'Lain-lain': 'Others'
};

export const translateCategory = (name: string, lang: Lang) =>
  lang === 'en' ? CATEGORY_EN[name] || name : name;

// Inline translation: t('Simpan', 'Save'). Keeps both languages next to the UI they belong to.
export function useT() {
  const lang = useLangStore((s) => s.lang);
  const t = (id: string, en: string) => (lang === 'en' ? en : id);
  t.lang = lang;
  t.cat = (name: string) => translateCategory(name, lang);
  return t;
}
