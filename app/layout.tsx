import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Konark Sun Temple - Maker\'s Story',
  description: 'An animated narration from the perspective of the temple\'s maker during construction.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
