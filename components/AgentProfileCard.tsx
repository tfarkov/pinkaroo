import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import React from 'react';
import { API, STALE_TIME_5_MIN, UI } from '../lib/constants';
import { getMockUser } from '../lib/mockData';

interface Props {
  agentId: string;
}

const AgentProfileCard = React.memo(function AgentProfileCard({ agentId }: Props) {
  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API.USERS}/${agentId}`);
        if (res.ok) return res.json();
        return getMockUser(agentId);
      } catch {
        return getMockUser(agentId);
      }
    },
    staleTime: STALE_TIME_5_MIN,
  });

  const avatarUrl = agent?.image || agent?.profileImage;
  const displayName = agent?.name ?? 'Agent';
  const initial = displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="bg-white rounded-lg shadow-card border border-slate-200 p-5 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} width={80} height={80} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-slate-500" aria-hidden>{initial}</span>
        )}
      </div>
      <h3 className="font-bold text-slate-900 mt-3">{agent?.name ?? 'Agent'}</h3>
      <p className="text-sm text-slate-600">{UI.ROLE}: {agent?.role ?? '—'}</p>
      {agent?.email && <a href={`mailto:${agent.email}`} className="text-sm text-accent-600 font-semibold mt-1 hover:underline">Contact</a>}
      <p className="text-sm text-slate-600 mt-2">{agent?.bio || UI.NO_BIO}</p>
      {agent?.ratings != null && <p className="text-sm text-slate-600 mt-1">{agent.ratings} ★</p>}
    </div>
  );
});

export default AgentProfileCard;
