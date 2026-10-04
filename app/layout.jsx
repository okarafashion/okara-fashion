import './globals.css';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'OKARA | Luxury Monochromatic Fashion & Architectural Cord Sets',
  description:
    'OKARA - Wear Your Story. A luxury Indian clothing brand specializing in architectural cord sets, sculpted blazers, and editorial fashion in timeless black and white.',
  openGraph: {
    title: 'OKARA | Luxury Monochromatic Fashion',
    description: 'Wear Your Story with sculptural silhouettes and refined cord sets.',
    images: ['/okara-logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
