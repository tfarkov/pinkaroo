import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';
import { getPrimaryDashboardHref } from '../lib/constants';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, role } = useAuth();

  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="bg-pink-500 text-white p-2 rounded" aria-label="Menu" aria-expanded={isOpen}>
        ☰
      </button>
      {isOpen && (
        <nav className="fixed top-0 left-0 right-0 bg-pink-600 text-white p-4 flex flex-col space-y-4">
          <Link href="/">Home</Link>
          <Link href="/#listings">Find a Home</Link>
          {isAuthenticated && <Link href={getPrimaryDashboardHref(role)}>Dashboard</Link>}
          <Link href="/favorites">Favorites</Link>
          {isAuthenticated && <Link href="/profile">Profile</Link>}
        </nav>
      )}
    </div>
  );
}
