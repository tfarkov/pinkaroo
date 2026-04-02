import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useAuth } from '../lib/hooks/useAuth';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import NotificationsDropdown from './NotificationsDropdown';

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <circle cx="22" cy="22" r="22" fill="#db2777" />
      <text x="22" y="29" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="system-ui,sans-serif">P</text>
    </svg>
  );
}

export default function Header() {
  const { isAuthenticated, isRealtor, isBroker, isAdmin } = useAuth();
  const { isMetric, toggleUnit } = useUnitToggle();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navLinks = [
    { href: '/', label: 'Find a Home' },
    { href: '/why-pinkaroo', label: 'Why Pinkaroo' },
    ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(isRealtor ? [{ href: '/listings/new', label: 'Add Listing' }] : []),
    ...(isBroker ? [{ href: '/dashboard/broker', label: 'Broker' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
    ...((isRealtor || isBroker || isAdmin) ? [{ href: '/dashboard/crm', label: 'CRM' }] : []),
    { href: '/mls-search', label: 'MLS Search' },
    { href: '/favorites', label: 'Favourites' },
  ];

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/?signedOut=1' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-header shadow-nav">
      <div className="content-width flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0 text-white hover:text-white" aria-label="Pinkaroo home">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-white">
            {logoError ? (
              <LogoIcon className="w-11 h-11 flex-shrink-0" />
            ) : (
              <img
                src="/logo-white.png"
                alt="Pinkaroo"
                width={44}
                height={44}
                className="w-11 h-11 object-contain block"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <span className="font-bold text-lg hidden sm:inline">Pinkaroo</span>
        </Link>
        <nav aria-label="Primary" className="hidden md:flex items-center gap-0">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 text-white/95 hover:text-white hover:bg-white/10 rounded-md text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleUnit}
            className="ml-1 px-3 py-1.5 rounded-md text-white/80 hover:bg-white/10 text-sm font-medium"
            title={isMetric ? 'Switch to Imperial (sq ft)' : 'Switch to Metric (m²)'}
          >
            {isMetric ? 'Metric' : 'Imperial'}
          </button>
          {isAuthenticated && (
            <div className="ml-1">
              <NotificationsDropdown />
            </div>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="ml-3 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md text-sm font-medium disabled:opacity-60"
            >
              Sign out
            </button>
          ) : (
            <Link href="/signin" className="ml-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors">
              Sign In
            </Link>
          )}
        </nav>
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && <NotificationsDropdown />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-white hover:bg-white/10"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-primary-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div id="mobile-primary-menu" className="md:hidden bg-header-light border-t border-white/10 px-4 py-4">
          <div className="flex flex-col gap-0">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 text-white hover:bg-accent-600 rounded-md font-medium"
              >
                {label}
              </Link>
            ))}
            <button type="button" onClick={toggleUnit} className="px-3 py-3 text-left text-white/90 hover:bg-white/10 rounded-md font-medium">
              Units: {isMetric ? 'Metric' : 'Imperial'}
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleSignOut();
                }}
                disabled={isSigningOut}
                className="px-3 py-3 text-white/90 font-medium text-left disabled:opacity-60"
              >
                Sign out
              </button>
            ) : (
              <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="mt-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 rounded-md text-center">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
