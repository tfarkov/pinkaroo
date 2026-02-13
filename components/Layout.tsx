import Header from './Header';
import Footer from './Footer';
import BottomNav from './ui/BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  /** Optional class for the main content area (default: content-width with bottom padding) */
  mainClassName?: string;
  /** Set false to hide footer (e.g. minimal error pages). Default true. */
  showFooter?: boolean;
}

export default function Layout({ children, mainClassName = 'flex-1 content-width pb-14 max-w-5xl mx-auto', showFooter = true }: LayoutProps) {
  return (
    <div className="page-container flex flex-col min-h-screen">
      <Header />
      <main className={mainClassName} role="main">
        {children}
      </main>
      {showFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
