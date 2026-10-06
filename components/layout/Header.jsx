'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, Heart, Menu, X, Sliders } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'ALL COLLECTIONS', href: '/shop' },
    { name: 'CORD SETS', href: '/shop?category=cord-sets' },
    { name: 'BLAZERS', href: '/shop?category=blazers' },
    { name: 'EDITORIAL DRESSES', href: '/shop?category=dresses' },
    { name: 'ADMIN STUDIO', href: '/admin/products', highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)]">
      {/* Top Editorial Ticker */}
      <div className="bg-[var(--color-primary)] text-[var(--color-secondary)] py-1.5 px-4 text-center text-[10px] tracking-[0.25em] uppercase font-light">
        OKARA • LUXURY MONOCHROME ESSENTIALS • COMPLIMENTARY SHIPPING ACROSS INDIA
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[var(--color-text)] hover:text-[var(--color-muted)]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Desktop Left Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.slice(0, 3).map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs uppercase tracking-[0.18em] text-[var(--color-text)] hover:text-[var(--color-muted)] subtle-transition font-medium"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Center Brand Identity (Logo) */}
        <Link href="/" className="flex flex-col items-center group py-2">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/okara-logo.png`}
              alt="OKARA Clothing Brand - Wear Your Story"
              width={64}
              height={64}
              className="object-contain w-full h-full group-hover:scale-105 subtle-transition"
              priority
            />
          </div>
          <span className="text-[10px] tracking-[0.35em] text-[var(--color-text)] font-light mt-0.5 uppercase hidden sm:block">
            OKARA
          </span>
        </Link>

        {/* Desktop Right Nav & Actions */}
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-8 mr-2">
            {navLinks.slice(3).map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs uppercase tracking-[0.18em] subtle-transition font-medium ${
                  link.highlight
                    ? 'px-3 py-1 bg-[var(--color-primary)] text-[var(--color-secondary)] hover:bg-[var(--color-primary-hover)]'
                    : 'text-[var(--color-text)] hover:text-[var(--color-muted)]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Quick Icons */}
          <Link
            href="/shop"
            className="p-2 text-[var(--color-text)] hover:text-[var(--color-muted)] subtle-transition"
            title="Search Collection"
          >
            <Search size={18} />
          </Link>

          <Link
            href="/shop"
            className="hidden sm:block p-2 text-[var(--color-text)] hover:text-[var(--color-muted)] subtle-transition"
            title="Wishlist"
          >
            <Heart size={18} />
          </Link>

          <Link
            href="/shop"
            className="relative p-2 text-[var(--color-text)] hover:text-[var(--color-muted)] subtle-transition"
            title="Shopping Bag"
          >
            <ShoppingBag size={18} />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[var(--color-primary)] text-[var(--color-secondary)] text-[8px] font-bold rounded-full flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm uppercase tracking-[0.2em] py-2 border-b border-[var(--color-border-light)] ${
                  link.highlight
                    ? 'text-[var(--color-primary)] font-bold'
                    : 'text-[var(--color-text)]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
