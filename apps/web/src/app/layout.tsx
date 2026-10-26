import type { Metadata } from 'next';
import './globals.css';
import { EmergencyBanner } from '../components/layout/EmergencyBanner';
import { Footer } from '../components/layout/Footer';
import { AuthProvider } from '../lib/auth-context';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>
          <EmergencyBanner />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
