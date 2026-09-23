import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZxWallet - Bot WhatsApp & Keuangan',
  description: 'Pengatur Keuangan Otomatis Terhubung Bot WhatsApp AI',
  manifest: '/manifest.json',
  icons: {
    icon: '/pwa-icon.svg',
    apple: '/apple-touch-icon.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZxWallet'
  }
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body 
        className="bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-emerald-500/20 selection:text-emerald-400 md:pb-0 min-h-[100dvh]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
      >
        {children}
      </body>
    </html>
  );
}
