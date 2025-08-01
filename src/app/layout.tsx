import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Yargı SaaS - Türk Hukuk Sistemine Kapsamlı Erişim',
  description: 'Türkiye\'nin 11 farklı hukuk kurumundan kapsamlı arama yapın. Yargıtay, Danıştay, Anayasa Mahkemesi ve daha fazlası. AI destekli analiz ve özet özelliği.',
  keywords: 'yargı, hukuk, karar arama, türk hukuku, yargıtay, danıştay, anayasa mahkemesi',
  authors: [{ name: 'Yargı SaaS Team' }],
  openGraph: {
    title: 'Yargı SaaS - Türk Hukuk Sistemine Kapsamlı Erişim',
    description: 'Türkiye\'nin en kapsamlı hukuk karar arama platformu',
    type: 'website',
    locale: 'tr_TR',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}