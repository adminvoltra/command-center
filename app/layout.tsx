import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Voltra Command Center',
  description: 'Operations dashboard for Voltra',
  icons: {
    icon: '/branding/logo.png',
    apple: '/branding/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app">
            <NavBar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
