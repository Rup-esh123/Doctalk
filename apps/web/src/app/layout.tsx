import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EmergencyBanner } from '../components/layout/EmergencyBanner';
import { Footer } from '../components/layout/Footer';
import { AuthProvider } from '../lib/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'DocTALK — Telemedicine & Managed Healthcare Platform India',
  description:
    'Consult with verified medical council practitioners across India via secure video, audio, and chat. Transparent pricing, digitally signed prescriptions, and private medical records.',
  keywords: [
    'telemedicine india',
    'online doctor consultation',
    'medical council verified doctors',
    'telehealth',
    'digital prescription',
    'doctalk',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans ${inter.className}`}>
        <AuthProvider>
          <EmergencyBanner />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
