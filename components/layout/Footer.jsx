'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {

  return (
    <footer className="bg-[var(--color-primary)] text-[var(--color-secondary)] border-t border-neutral-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-neutral-800">
          {/* Brand Manifesto & Logo */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="w-16 h-16 relative">
              <Image
                src="/okara-logo.png"
                alt="OKARA Fashion"
                width={64}
                height={64}
                className="object-contain w-full h-full brightness-110"
              />
            </div>
            <h4 className="font-editorial text-2xl tracking-wide">OKARA</h4>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Wear Your Story. A curated universe of sculptural silhouettes, architectural cord sets,
              and monochromatic luxury tailored for the discerning individual.
            </p>
          </div>

          {/* Collections */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs uppercase tracking-[0.25em] text-neutral-300 font-medium">
              Collections
            </h5>
            <div className="flex flex-col gap-2 text-xs text-neutral-400 font-light">
              <Link href="/shop?category=cord-sets" className="hover:text-white subtle-transition">
                Cord Sets
              </Link>
              <Link href="/shop?category=blazers" className="hover:text-white subtle-transition">
                Tailored Blazers
              </Link>
              <Link href="/shop?category=dresses" className="hover:text-white subtle-transition">
                Editorial Dresses
              </Link>
              <Link href="/shop?category=tops-shirts" className="hover:text-white subtle-transition">
                Silk Tops & Shirts
              </Link>
              <Link href="/shop" className="hover:text-white subtle-transition">
                New Arrivals
              </Link>
            </div>
          </div>

          {/* Client Service */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs uppercase tracking-[0.25em] text-neutral-300 font-medium">
              Client Service
            </h5>
            <div className="flex flex-col gap-2 text-xs text-neutral-400 font-light">
              <Link href="/shop" className="hover:text-white subtle-transition">
                Bespoke Sizing Consultation
              </Link>
              <Link href="/shop" className="hover:text-white subtle-transition">
                Complimentary Shipping
              </Link>
              <Link href="/shop" className="hover:text-white subtle-transition">
                Returns & Exchanges
              </Link>
              <Link href="/shop" className="hover:text-white subtle-transition">
                Garment Care Guide
              </Link>
              <Link href="/admin/products" className="hover:text-white subtle-transition">
                Image System Studio
              </Link>
            </div>
          </div>

          {/* Newsletter / The Monochromatic Dispatch */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs uppercase tracking-[0.25em] text-neutral-300 font-medium">
              The OKARA Dispatch
            </h5>
            <p className="text-xs text-neutral-400 font-light">
              Receive private preview access to seasonal edits and limited monochromatic releases.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-2 flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                className="py-2 px-4 bg-white text-black text-xs uppercase tracking-[0.2em] font-medium hover:bg-neutral-200 subtle-transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-light gap-4">
          <p>© {new Date().getFullYear()} OKARA CLOTHING BRAND. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <Link href="/shop" className="hover:text-neutral-400">
              PRIVACY POLICY
            </Link>
            <Link href="/shop" className="hover:text-neutral-400">
              TERMS OF SERVICE
            </Link>
            <Link href="/shop" className="hover:text-neutral-400">
              SUSTAINABILITY
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
