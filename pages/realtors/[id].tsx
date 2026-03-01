import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GetStaticProps, GetStaticPaths } from 'next';
import AgentProfileCard from '../../components/AgentProfileCard';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/ui/BottomNav';
import { API, UI, getListingPageUrl } from '../../lib/constants';
import { getMockUser } from '../../lib/mockData';

export default function RealtorProfile({ id }: { id: string }) {
  const { data: realtor } = useQuery({
    queryKey: ['realtor', id],
    queryFn: async () => {
      try {
        const res = await fetch(`${API.REALTORS}/${id}`);
        if (res.ok) return res.json();
        return getMockUser(id);
      } catch {
        return getMockUser(id);
      }
    },
  });

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width max-w-5xl mx-auto pb-14 md:pb-8">
        <AgentProfileCard agentId={id} />
        <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">{UI.LISTINGS_TITLE}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {realtor?.listings?.map((l: { id: string; title?: string }) => {
            const listingUrl = getListingPageUrl(l?.id);
            return (
              <div key={l.id} className="bg-white rounded-lg shadow-card border border-slate-200 p-4 hover:shadow-card-hover transition-shadow">
                <h3 className="font-bold text-slate-900">{l.title}</h3>
                {listingUrl ? (
                  <Link href={listingUrl} className="text-accent-600 font-semibold text-sm mt-2 inline-block hover:text-accent-700">{UI.VIEW_DETAILS}</Link>
                ) : (
                  <span className="text-slate-500 text-sm mt-2 inline-block">{UI.VIEW_DETAILS}</span>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Paths are generated on demand; no API at build time
  return { paths: [], fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return { props: { id: params.id }, revalidate: 60 }; // ISR
};
