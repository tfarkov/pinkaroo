import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';

export default function Footer() {
  const { isAuthenticated, isRealtor, isBroker, isSystemAdmin, isOfficeAdmin } = useAuth();
  const { isMetric, toggleUnit } = useUnitToggle();
  const canAccessMLS = isRealtor || isBroker || isSystemAdmin || isOfficeAdmin;
  return (
    <footer className="bg-header text-white mt-auto">
      <div className="content-width py-5">

        {/* Main row: brand + nav links */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <p className="text-white font-bold text-base tracking-tight shrink-0">Pinkaroo</p>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-1.5 sm:justify-end">
            <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">Find a Home</Link>
            <Link href="/why-pinkaroo" className="text-white/70 hover:text-white text-sm transition-colors">Why Pinkaroo</Link>
            {canAccessMLS && (
              <Link href="/mls-search" className="text-white/70 hover:text-white text-sm transition-colors">MLS Search</Link>
            )}
            <Link href="/favorites" className="text-white/70 hover:text-white text-sm transition-colors">Favourites</Link>
            {isAuthenticated && (
              <Link href="/profile" className="text-white/70 hover:text-white text-sm transition-colors">Profile</Link>
            )}
            <span className="text-white/20 hidden sm:inline">|</span>
            <Link href="/terms" className="text-white/70 hover:text-white text-sm transition-colors">Terms</Link>
            <Link href="/privacy" className="text-white/70 hover:text-white text-sm transition-colors">Privacy</Link>
            <Link href="/cookie-policy" className="text-white/70 hover:text-white text-sm transition-colors">Cookies</Link>
            <button
              type="button"
              onClick={toggleUnit}
              className="inline-flex items-center self-center p-0 m-0 min-h-0 border-0 bg-transparent text-white/70 hover:text-white text-sm transition-colors cursor-pointer font-inherit text-left"
              title={isMetric ? 'Switch to Imperial (sq ft)' : 'Switch to Metric (m²)'}
              aria-label={isMetric ? 'Use imperial units' : 'Use metric units'}
              aria-pressed={isMetric}
            >
              {isMetric ? 'Metric' : 'Imperial'}
            </button>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p className="text-white/70 text-xs">
            &copy; {new Date().getFullYear()} Pinkaroo Real Estate Inc. All rights reserved.
          </p>
          <p className="text-white/70 text-xs">
            Listing data sourced from MLS&reg; &mdash; not guaranteed. Personal, non-commercial use only.
          </p>
        </div>

      </div>
    </footer>
  );
}
