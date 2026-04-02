import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, CONTENT_TYPE, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function BrokerClientOversightPage() {
  const { isBroker } = useAuth();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [realtorId, setRealtorId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['broker-client-oversight'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_CLIENT_OVERSIGHT, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load client oversight');
      return res.json();
    },
    enabled: isBroker,
  });
  const { data: stats } = useQuery({
    queryKey: ['broker-stats'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_STATS, { credentials: 'include' });
      if (!res.ok) return { realtors: [] };
      return res.json();
    },
    enabled: isBroker,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.BROKER_CLIENT_OVERSIGHT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ clientId, realtorId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setClientId('');
      queryClient.invalidateQueries({ queryKey: ['broker-client-oversight'] });
    },
  });

  if (!isBroker) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  const stalled = (data?.stalled ?? []) as { id: string; name?: string; status?: string; owner?: { name?: string } | null }[];
  const aging = (data?.aging ?? []) as { id: string; name?: string; daysOpen?: number; status?: string; realtorName?: string }[];
  const clients = (data?.clients ?? []) as { id: string; name?: string; status?: string; owner?: { name?: string } | null }[];
  const realtors = ((stats?.realtors ?? []) as { id: string; name?: string; email?: string }[]);

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.BROKER_CLIENT_OVERSIGHT}</h1>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Reassign client owner</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input-field">
            <option value="">Select client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.id}</option>)}
          </select>
          <select value={realtorId} onChange={(e) => setRealtorId(e.target.value)} className="input-field">
            <option value="">Select realtor</option>
            {realtors.map((r) => <option key={r.id} value={r.id}>{r.name ?? r.email ?? r.id}</option>)}
          </select>
          <button type="button" className="btn-primary" disabled={!clientId || !realtorId || assignMutation.isPending} onClick={() => assignMutation.mutate()}>
            {assignMutation.isPending ? 'Saving...' : 'Reassign'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Stalled risk queue</h2>
          {isLoading ? <p className="text-slate-500">{UI.LOADING}</p> : (
            <ul className="space-y-2">
              {stalled.length === 0 && <li className="text-slate-500 text-sm">No stalled clients right now.</li>}
              {stalled.map((c) => (
                <li key={c.id} className="border border-slate-200 rounded-md p-3 text-sm">
                  <span className="font-medium text-slate-900">{c.name ?? 'Unnamed client'}</span>
                  <span className="text-slate-600"> · {c.status ?? 'Unknown'} · Owner: {c.owner?.name ?? 'Unassigned'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Aging leads</h2>
          <ul className="space-y-2">
            {aging.length === 0 && <li className="text-slate-500 text-sm">No aging clients.</li>}
            {aging.map((c) => (
              <li key={c.id} className="border border-slate-200 rounded-md p-3 text-sm">
                <span className="font-medium text-slate-900">{c.name ?? 'Unnamed client'}</span>
                <span className="text-slate-600"> · {c.daysOpen ?? 0} days · {c.status ?? 'Unknown'} · {c.realtorName ?? 'Unknown owner'}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </DashboardLayout>
  );
}
