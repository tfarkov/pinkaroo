import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/hooks/useAuth';

const publicStartNavItems = [
  { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/#listings', label: 'Find a Home', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
];
const publicEndNavItems = [
  { href: '/favorites', label: 'Favourites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];
const dashboardNavItem = { href: '/dashboard', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' };
const profileNavItem = { href: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' };

export default function BottomNav() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const navItems = [
    ...publicStartNavItems,
    ...(isAuthenticated ? [dashboardNavItem] : []),
    ...publicEndNavItems,
    ...(isAuthenticated ? [profileNavItem] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-header shadow-nav">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ href, label, icon }) => {
          const isActive = router.pathname === href || (href !== '/' && router.pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-md transition-colors min-w-0 ${
                isActive ? 'text-accent-400' : 'text-white/80 hover:text-white'
              }`}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span className="text-xs font-medium truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
