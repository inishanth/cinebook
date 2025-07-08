import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { WatchlistProvider } from '@/context/watchlist-context';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';

export const metadata: Metadata = {
  title: 'ReelDeal',
  description: 'Find your next favorite movie.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <WatchlistProvider>
          <main className="flex-grow container mx-auto px-4 py-8 pb-24">
            {children}
          </main>
          <BottomTabBar />
          <Toaster />
        </WatchlistProvider>
      </body>
    </html>
  );
}
