import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="bg-header text-white mt-auto">
      <div className="content-width py-8 space-y-4">
        <div className="flex flex-wrap gap-6 justify-between items-center">
          <div className="flex flex-wrap gap-6">
            <Link href="/" className="text-white/90 hover:text-white font-medium">
              Find a Home
            </Link>
            <Link href="/mls-search" className="text-white/90 hover:text-white font-medium">
              MLS Search
            </Link>
            <Link href="/favorites" className="text-white/90 hover:text-white font-medium">
              Favourites
            </Link>
            {isAuthenticated && (
              <Link href="/profile" className="text-white/90 hover:text-white font-medium">
                Profile
              </Link>
            )}
          </div>
          <p className="text-white/70 text-sm">© {new Date().getFullYear()} Pinkaroo Real Estate Inc. All rights reserved.</p>
        </div>
        <div className="border-t border-white/10 pt-4 flex flex-wrap gap-4">
          <Link href="/terms" className="text-white/60 hover:text-white/90 text-sm">
            Terms of Use
          </Link>
          <Link href="/privacy" className="text-white/60 hover:text-white/90 text-sm">
            Privacy Statement
          </Link>
          <Link href="/cookie-policy" className="text-white/60 hover:text-white/90 text-sm">
            Cookie Policy
          </Link>
          <span className="text-white/30 text-sm hidden sm:inline">|</span>
          <span className="text-white/40 text-sm">
            Listing data sourced from MLS&reg; &mdash; not guaranteed. For personal, non-commercial use only.
          </span>
        </div>
      </div>
    </footer>
  );
}
