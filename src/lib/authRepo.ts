import db from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

// The only number the bot replies to and the only account that manages the WhatsApp gateway.
export const ADMIN_PHONE = process.env.ADMIN_PHONE ? process.env.ADMIN_PHONE.replace(/\D/g, '').replace(/^0/, '62') : '';

export function normalizePhone(phone: string): string {
  let clean = (phone || '').toString().replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return clean;
}

export function findUserByPhone(phone: string): any {
  const cleanPhone = normalizePhone(phone);
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);
}

export function findUserById(id: number): User | null {
  return (db.prepare('SELECT id, phone, name, is_verified, created_at FROM users WHERE id = ?').get(id) as User) || null;
}

export function createUser({ name, phone, password }: { name: string; phone: string; password: string }): User | null {
  const cleanPhone = normalizePhone(phone);
  const password_hash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(`
    INSERT INTO users (name, phone, password_hash, is_verified)
    VALUES (?, ?, ?, 1)
  `);

  const info = stmt.run(name, cleanPhone, password_hash);
  return findUserById(Number(info.lastInsertRowid));
}

export function createOrGetWaUser({ name, phone }: { name: string; phone: string }): User | null {
  const cleanPhone = normalizePhone(phone);
  let user: any = findUserByPhone(cleanPhone);
  if (!user) {
    const randomPass = Math.random().toString(36).slice(-8);
    const password_hash = bcrypt.hashSync(randomPass, 10);
    const info = db.prepare(`
      INSERT INTO users (name, phone, password_hash, is_verified)
      VALUES (?, ?, ?, 1)
    `).run(name || 'Pengguna WA', cleanPhone, password_hash);
    user = findUserById(Number(info.lastInsertRowid));
  }
  return user;
}

export function verifyPassword(user: any, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

export function generateToken(user: User | any): string {
  return jwt.sign(
    { id: user.id, phone: user.phone, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function createOtp(phone: string): string {
  const cleanPhone = normalizePhone(phone);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(cleanPhone);

  db.prepare(`
    INSERT INTO otp_codes (phone, code, expires_at)
    VALUES (?, ?, ?)
  `).run(cleanPhone, code, expiresAt);

  return code;
}

export function verifyOtp(phone: string, inputCode: string): boolean {
  const cleanPhone = normalizePhone(phone);
  const record = db.prepare(`
    SELECT * FROM otp_codes
    WHERE phone = ? AND code = ? AND expires_at > CURRENT_TIMESTAMP
    ORDER BY id DESC LIMIT 1
  `).get(cleanPhone, inputCode.trim());

  if (record) {
    db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(cleanPhone);
    return true;
  }
  return false;
}
