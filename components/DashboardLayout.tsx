import Header from './Header';
import Footer from './Footer';
import BottomNav from './ui/BottomNav';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="page-container flex flex-col">
      <Header />
      <div className="flex-1 flex min-h-0">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 pb-14 md:pb-8">
          <div className="content-width max-w-5xl mx-auto px-4 md:px-6">
            {children}
          </div>
        </main>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
