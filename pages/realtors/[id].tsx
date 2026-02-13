import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GetStaticProps, GetStaticPaths } from 'next';
import AgentProfileCard from '../../components/AgentProfileCard';
import Header from '../../components/Header';
import BottomNav from '../../components/ui/BottomNav';
import { API, UI } from '../../lib/constants';

export default function RealtorProfile({ id }: { id: string }) {
  const { data: realtor } = useQuery({ queryKey: ['realtor', id], queryFn: () => fetch(`${API.REALTORS}/${id}`).then(res => res.json()) });

  return (
    <div>
      <Header />
      <main className="p-4 max-w-5xl mx-auto pb-16 md:pb-0">
        <AgentProfileCard agentId={id} />
        <h2 className="text-2xl mt-8 mb-4">{UI.LISTINGS_TITLE}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {realtor?.listings?.map((l: any) => (
            <div key={l.id} className="border p-4 rounded shadow">
              <h3 className="font-bold">{l.title}</h3>
              <p></p>
              <Link href={`/listings/${l.id}`} className="text-pink-500">{UI.VIEW_DETAILS}</Link>
            </div>
          ))}
        </div>
      </main>
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
