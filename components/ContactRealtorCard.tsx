import type { RealtorTeamMember } from '../lib/types';

interface ContactRealtorCardProps {
  realtor: RealtorTeamMember | null;
  isLoading?: boolean;
}

export default function ContactRealtorCard({ realtor, isLoading }: ContactRealtorCardProps) {
  if (isLoading) {
    return <p className="text-slate-500 text-sm py-4">Loading…</p>;
  }
  if (!realtor) {
    return <p className="text-slate-500 text-sm py-2">No realtor available.</p>;
  }

  const displayName = realtor.name ?? '—';
  const initial =
    displayName !== '—' ? displayName.trim().charAt(0).toUpperCase() : '?';
  const firstName = realtor.name?.split(' ')[0] ?? 'Realtor';

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center mb-3">
        {realtor.image ? (
          <img
            src={realtor.image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-slate-500" aria-hidden>
            {initial}
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-900">{displayName}</h3>
      <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">
        Realtor
      </p>
      {realtor.bio && (
        <p className="text-sm text-slate-600 mt-2 line-clamp-3">{realtor.bio}</p>
      )}
      <dl className="mt-3 w-full text-left space-y-1.5 text-sm">
        {realtor.email && (
          <div>
            <dt className="text-slate-500 font-medium">Email</dt>
            <dd>
              <a
                href={'mailto:' + realtor.email}
                className="text-accent-600 hover:underline break-all"
              >
                {realtor.email}
              </a>
            </dd>
          </div>
        )}
        {realtor.phone && (
          <div>
            <dt className="text-slate-500 font-medium">Phone</dt>
            <dd>
              <a
                href={'tel:' + realtor.phone.replace(/\D/g, '')}
                className="text-accent-600 hover:underline"
              >
                {realtor.phone}
              </a>
            </dd>
          </div>
        )}
        {realtor.availableHours && (
          <div>
            <dt className="text-slate-500 font-medium">Available</dt>
            <dd className="text-slate-700">{realtor.availableHours}</dd>
          </div>
        )}
      </dl>
      {realtor.email && (
        <a
          href={'mailto:' + realtor.email}
          className="mt-3 inline-block w-full py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm transition-colors"
        >
          Contact {firstName}
        </a>
      )}
    </div>
  );
}
