import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.88.63'],
  serverExternalPackages: ['better-sqlite3', '@whiskeysockets/baileys', 'pino', 'pino-pretty', 'exceljs', 'jspdf', 'jspdf-autotable'],
};

export default nextConfig;
