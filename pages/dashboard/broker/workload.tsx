import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, CONTENT_TYPE, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';
import { getMockBrokerWorkload } from '../../../lib/mockData';

export default function BrokerWorkloadPage() {
  const { isBroker } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [realtorId, setRealtorId] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['broker-workload'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_WORKLOAD, { credentials: 'include' });
      if (!res.ok) return getMockBrokerWorkload();
      return res.json();
    },
    enabled: isBroker,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.BROKER_WORKLOAD, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ title, realtorId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setTitle('');
      queryClient.invalidateQueries({ queryKey: ['broker-workload'] });
    },
  });

  const rebalanceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.BROKER_WORKLOAD, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ action: 'rebalance' }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-workload'] }),
  });

  if (!isBroker) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  const assignments = (data?.assignments ?? []) as { id: string; title: string; status: string; realtor?: { name?: string } }[];
  const capacity = (data?.capacity ?? []) as { id: string; name?: string; openAssignments?: number }[];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.BROKER_WORKLOAD}</h1>
      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Assign a workload item</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Task title" />
          <select value={realtorId} onChange={(e) => setRealtorId(e.target.value)} className="input-field">
            <option value="">Select realtor</option>
            {capacity.map((r) => <option key={r.id} value={r.id}>{r.name ?? r.id}</option>)}
          </select>
          <button
            type="button"
            className="btn-primary"
            disabled={!title.trim() || !realtorId || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Assigning...' : 'Assign task'}
          </button>
        </div>
        <button type="button" className="btn-secondary mt-3" onClick={() => rebalanceMutation.mutate()} disabled={rebalanceMutation.isPending}>
          {rebalanceMutation.isPending ? 'Rebalancing...' : 'Rebalance open workload'}
        </button>
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Capacity snapshot</h2>
        {isLoading ? <p className="text-slate-500">{UI.LOADING}</p> : (
          <ul className="space-y-2">
            {capacity.map((r) => (
              <li key={r.id} className="border border-slate-200 rounded-md p-3 text-sm text-slate-700">
                {(r.name ?? 'Unnamed realtor')} · Open assignments: {r.openAssignments ?? 0}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Assignment queue</h2>
        {assignments.length === 0 ? (
          <p className="text-slate-500 text-sm">No assignments yet.</p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((a) => (
              <li key={a.id} className="border border-slate-200 rounded-md p-3 text-sm">
                <span className="font-medium text-slate-900">{a.title}</span>
                <span className="text-slate-600"> · {a.status} · {(a.realtor?.name ?? 'Unassigned')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
