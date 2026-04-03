import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, CONTENT_TYPE, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';
import { getMockBrokerAdminControls } from '../../../lib/mockData';

type Team = { id: string; name?: string; targetListings?: number | null; targetRevenue?: number | null; targetInteractions?: number | null };
type Realtor = { id: string; name?: string; email?: string; isTeamLead?: boolean | null };

export default function BrokerAdminControlsPage() {
  const { isBroker } = useAuth();
  const queryClient = useQueryClient();
  const [targetDrafts, setTargetDrafts] = useState<Record<string, { targetListings: string; targetRevenue: string; targetInteractions: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['broker-admin-controls'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_ADMIN_CONTROLS, { credentials: 'include' });
      if (!res.ok) return getMockBrokerAdminControls();
      return res.json();
    },
    enabled: isBroker,
  });

  const updateTargets = useMutation({
    mutationFn: async ({ teamId, values }: { teamId: string; values: { targetListings: string; targetRevenue: string; targetInteractions: string } }) => {
      const res = await fetch(API.BROKER_ADMIN_CONTROLS, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({
          action: 'update-team-targets',
          teamId,
          targetListings: Number(values.targetListings || 0),
          targetRevenue: Number(values.targetRevenue || 0),
          targetInteractions: Number(values.targetInteractions || 0),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-admin-controls'] }),
  });

  const setTeamLead = useMutation({
    mutationFn: async ({ realtorId, isTeamLead }: { realtorId: string; isTeamLead: boolean }) => {
      const res = await fetch(API.BROKER_ADMIN_CONTROLS, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ action: 'set-team-lead', realtorId, isTeamLead }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-admin-controls'] }),
  });

  if (!isBroker) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  const teams = (data?.teams ?? []) as Team[];
  const realtors = (data?.realtors ?? []) as Realtor[];
  const auditLogs = (data?.auditLogs ?? []) as { id: string; action?: string; entityType?: string; createdAt?: string; actor?: { name?: string; email?: string } }[];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.BROKER_ADMIN_CONTROLS}</h1>
      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Team targets</h2>
        {teams.length === 0 ? (
          <p className="text-slate-500 text-sm">No teams available.</p>
        ) : (
          <ul className="space-y-4">
            {teams.map((team) => {
              const draft = targetDrafts[team.id] ?? {
                targetListings: String(team.targetListings ?? 0),
                targetRevenue: String(team.targetRevenue ?? 0),
                targetInteractions: String(team.targetInteractions ?? 0),
              };
              return (
                <li key={team.id} className="border border-slate-200 rounded-md p-3">
                  <p className="font-medium text-slate-900 mb-2">{team.name ?? team.id}</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input className="input-field" value={draft.targetListings} onChange={(e) => setTargetDrafts((prev) => ({ ...prev, [team.id]: { ...draft, targetListings: e.target.value } }))} placeholder="Listings target" />
                    <input className="input-field" value={draft.targetRevenue} onChange={(e) => setTargetDrafts((prev) => ({ ...prev, [team.id]: { ...draft, targetRevenue: e.target.value } }))} placeholder="Revenue target" />
                    <input className="input-field" value={draft.targetInteractions} onChange={(e) => setTargetDrafts((prev) => ({ ...prev, [team.id]: { ...draft, targetInteractions: e.target.value } }))} placeholder="Interactions target" />
                    <button type="button" className="btn-primary" onClick={() => updateTargets.mutate({ teamId: team.id, values: draft })}>Save targets</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Team lead delegation</h2>
        <ul className="space-y-2">
          {realtors.map((r) => (
            <li key={r.id} className="border border-slate-200 rounded-md p-3 text-sm flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-900">{r.name ?? r.email ?? r.id}</span>
              <button type="button" className="btn-secondary" onClick={() => setTeamLead.mutate({ realtorId: r.id, isTeamLead: !r.isTeamLead })}>
                {r.isTeamLead ? 'Remove team lead' : 'Make team lead'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Audit trail</h2>
        {isLoading ? <p className="text-slate-500">{UI.LOADING}</p> : (
          <ul className="space-y-2">
            {auditLogs.length === 0 && <li className="text-slate-500 text-sm">No audit events yet.</li>}
            {auditLogs.slice(0, 100).map((log) => (
              <li key={log.id} className="border border-slate-200 rounded-md p-3 text-sm">
                <span className="font-medium text-slate-900">{log.action ?? 'Unknown action'}</span>
                <span className="text-slate-600"> · {log.entityType ?? 'Entity'} · {log.actor?.name ?? log.actor?.email ?? 'Unknown actor'}</span>
                <div className="text-xs text-slate-500 mt-1">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
