import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import NotificationsDropdown from './NotificationsDropdown';

export default function Header() {
  const { isAuthenticated, isRealtor, isBroker, isAdmin } = useAuth();
  const { isMetric, toggleUnit } = useUnitToggle();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/listings', label: 'Listings' },
    ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(isRealtor ? [{ href: '/listings/new', label: 'Add Listing' }] : []),
    ...(isBroker ? [{ href: '/dashboard/broker', label: 'Broker' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
    { href: '/mls-search', label: 'MLS Search' },
    { href: '/favorites', label: 'Favorites' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-nav border-b border-primary-100">
      <div className="content-width flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="Pinkaroo" width={40} height={40} priority className="rounded-lg" />
          <span className="font-semibold text-primary-900 hidden sm:inline">Pinkaroo</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="px-3 py-2 rounded-lg text-primary-700 hover:bg-primary-50 hover:text-primary-900 text-sm font-medium transition-colors">
              {label}
            </Link>
          ))}
          <button onClick={toggleUnit} className="ml-2 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 text-sm font-medium hover:bg-primary-200">
            {isMetric ? 'm²' : 'sq ft'}
          </button>
          <div className="ml-2"><NotificationsDropdown /></div>
          {isAuthenticated ? (
            <Link href="/api/auth/signout" className="ml-2 px-3 py-2 rounded-lg text-primary-600 hover:bg-primary-50 text-sm font-medium">Sign out</Link>
          ) : (
            <Link href="/api/auth/signin" className="ml-2 btn-primary text-sm py-2">Sign in</Link>
          )}
        </nav>
        <div className="flex md:hidden items-center gap-2">
          <NotificationsDropdown />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-100 bg-white px-4 py-4 shadow-lg">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-primary-700 hover:bg-primary-50 font-medium">
                {label}
              </Link>
            ))}
            <button onClick={toggleUnit} className="px-3 py-2.5 rounded-lg text-left text-primary-700 hover:bg-primary-50 font-medium">Units: {isMetric ? 'Metric' : 'Imperial'}</button>
            {isAuthenticated ? (
              <Link href="/api/auth/signout" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-primary-600 font-medium">Sign out</Link>
            ) : (
              <Link href="/api/auth/signin" onClick={() => setMobileMenuOpen(false)} className="btn-primary mt-2 text-center">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
