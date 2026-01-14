
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Background from '@/components/background';
import { cn } from '@/lib/utils';
import LayoutWrapper from '@/components/layout-wrapper';

export const metadata: Metadata = {
  title: 'Whisper - Military Grade Encrypted Messaging',
  description: 'End-to-end encrypted messages that self-destruct after reading.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Source+Code+Pro:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <Background />
        <LayoutWrapper>
          <div
            className={cn(
              "relative z-10 mx-auto flex min-h-[100svh] max-w-xl flex-col px-6 pb-16 pt-10 sm:px-4"
            )}
          >
            {children}
            <Toaster />
          </div>
        </LayoutWrapper>
      </body>
    </html>
  );
}
