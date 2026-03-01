import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="bg-header text-white mt-auto">
      <div className="content-width py-10">

        {/* Main nav row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 pb-8">
          {/* Brand blurb */}
          <div className="max-w-xs">
            <p className="text-white font-bold text-lg tracking-tight mb-1">Pinkaroo</p>
            <p className="text-white/50 text-sm leading-relaxed">
              Canada&apos;s modern real estate portal. Find, explore, and connect with confidence.
            </p>
          </div>

          {/* Nav groups */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Explore</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-white/75 hover:text-white text-sm transition-colors">
                    Find a Home
                  </Link>
                </li>
                <li>
                  <Link href="/mls-search" className="text-white/75 hover:text-white text-sm transition-colors">
                    MLS Search
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="text-white/75 hover:text-white text-sm transition-colors">
                    Favourites
                  </Link>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link href="/profile" className="text-white/75 hover:text-white text-sm transition-colors">
                      Profile
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-white/75 hover:text-white text-sm transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/75 hover:text-white text-sm transition-colors">
                    Privacy Statement
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-white/75 hover:text-white text-sm transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Pinkaroo Real Estate Inc. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Listing data sourced from MLS&reg; &mdash; not guaranteed. For personal, non-commercial use only.
          </p>
        </div>

      </div>
    </footer>
  );
}
