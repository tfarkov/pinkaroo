import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="bg-header text-white mt-auto">
      <div className="content-width py-5">

        {/* Main row: brand + nav links */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <p className="text-white font-bold text-base tracking-tight shrink-0">Pinkaroo</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 sm:justify-end">
            <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">Find a Home</Link>
            <Link href="/mls-search" className="text-white/70 hover:text-white text-sm transition-colors">MLS Search</Link>
            <Link href="/favorites" className="text-white/70 hover:text-white text-sm transition-colors">Favourites</Link>
            {isAuthenticated && (
              <Link href="/profile" className="text-white/70 hover:text-white text-sm transition-colors">Profile</Link>
            )}
            <span className="text-white/20 hidden sm:inline">|</span>
            <Link href="/terms" className="text-white/70 hover:text-white text-sm transition-colors">Terms</Link>
            <Link href="/privacy" className="text-white/70 hover:text-white text-sm transition-colors">Privacy</Link>
            <Link href="/cookie-policy" className="text-white/70 hover:text-white text-sm transition-colors">Cookies</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Pinkaroo Real Estate Inc. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Listing data sourced from MLS&reg; &mdash; not guaranteed. Personal, non-commercial use only.
          </p>
        </div>

      </div>
    </footer>
  );
}
