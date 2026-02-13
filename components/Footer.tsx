import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-header text-white mt-auto">
      <div className="content-width py-8">
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
            <Link href="/profile" className="text-white/90 hover:text-white font-medium">
              Profile
            </Link>
          </div>
          <p className="text-white/70 text-sm">© {new Date().getFullYear()} Pinkaroo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
