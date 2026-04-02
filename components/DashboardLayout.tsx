import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './ui/BottomNav';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '../lib/hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, status } = useAuth();
  const isDashboardRoute = router.pathname === '/dashboard' || router.pathname.startsWith('/dashboard/');

  useEffect(() => {
    if (!isDashboardRoute || status === 'loading' || isAuthenticated) return;
    const callbackUrl = encodeURIComponent(router.asPath || '/dashboard');
    router.replace(`/signin?callbackUrl=${callbackUrl}`);
  }, [isAuthenticated, isDashboardRoute, router, status]);

  const shouldBlockDashboardContent = isDashboardRoute && (status === 'loading' || !isAuthenticated);

  return (
    <div className="page-container flex flex-col">
      <Header />
      <div className="flex-1 flex min-h-0">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 pb-14 md:pb-8">
          <div className="content-width max-w-5xl mx-auto px-4 md:px-6">
            {shouldBlockDashboardContent ? (
              <p className="py-8 text-slate-500">{status === 'loading' ? 'Loading…' : 'Redirecting…'}</p>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
