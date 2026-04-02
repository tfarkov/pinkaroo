import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, CONTENT_TYPE, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function BrokerCommunicationsPage() {
  const { isBroker } = useAuth();
  const queryClient = useQueryClient();
  const [templateName, setTemplateName] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [teamId, setTeamId] = useState('');
  const [templateId, setTemplateId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['broker-comms'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_COMMS, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load comms');
      return res.json();
    },
    enabled: isBroker,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.BROKER_COMMS, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ mode: 'template', name: templateName, body: templateBody }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setTemplateName('');
      setTemplateBody('');
      queryClient.invalidateQueries({ queryKey: ['broker-comms'] });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.BROKER_COMMS, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({
          mode: 'broadcast',
          subject,
          message,
          teamId: teamId || null,
          templateId: templateId || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setSubject('');
      setMessage('');
      setTeamId('');
      setTemplateId('');
      queryClient.invalidateQueries({ queryKey: ['broker-comms'] });
    },
  });

  if (!isBroker) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  const templates = (data?.templates ?? []) as { id: string; name?: string; body?: string }[];
  const broadcasts = (data?.broadcasts ?? []) as { id: string; subject?: string; message?: string; createdAt?: string; team?: { name?: string } | null }[];
  const teams = (data?.teams ?? []) as { id: string; name?: string }[];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.BROKER_COMMUNICATIONS}</h1>
      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Create message template</h2>
        <div className="space-y-3">
          <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="input-field w-full" placeholder="Template name" />
          <textarea value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} className="input-field w-full min-h-[120px]" placeholder="Template body" />
          <button type="button" className="btn-primary" disabled={!templateName.trim() || !templateBody.trim() || createTemplateMutation.isPending} onClick={() => createTemplateMutation.mutate()}>
            {createTemplateMutation.isPending ? 'Saving...' : 'Save template'}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Send broadcast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" placeholder="Subject" />
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="input-field">
            <option value="">All teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name ?? t.id}</option>)}
          </select>
        </div>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="input-field w-full mb-3">
          <option value="">No template</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name ?? t.id}</option>)}
        </select>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field w-full min-h-[120px] mb-3" placeholder="Message" />
        <button type="button" className="btn-primary" disabled={!subject.trim() || !message.trim() || broadcastMutation.isPending} onClick={() => broadcastMutation.mutate()}>
          {broadcastMutation.isPending ? 'Sending...' : 'Send broadcast'}
        </button>
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Recent broadcasts</h2>
        {isLoading ? <p className="text-slate-500">{UI.LOADING}</p> : (
          <ul className="space-y-2">
            {broadcasts.length === 0 && <li className="text-slate-500 text-sm">No broadcasts sent yet.</li>}
            {broadcasts.map((item) => (
              <li key={item.id} className="border border-slate-200 rounded-md p-3 text-sm">
                <p className="font-medium text-slate-900">{item.subject ?? 'Untitled broadcast'}</p>
                <p className="text-slate-600 line-clamp-2">{item.message ?? ''}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(item.team?.name ? `Team: ${item.team.name}` : 'All teams')} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
