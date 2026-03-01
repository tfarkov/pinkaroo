import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  API,
  CLIENT_STATUSES,
  CONTENT_TYPE,
  INTERACTION_TYPES,
  STALE_TIME_5_MIN,
  UI,
} from '../../lib/constants';
import { getMockClients, getMockInteractions } from '../../lib/mockData';
import DashboardLayout from '../../components/DashboardLayout';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';

interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  status: string;
}

interface InteractionFormData {
  type: string;
  details: string;
  date: string;
}

type ClientRecord = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: string;
  linkedUserId?: string | null;
  interactions?: { id: string; type: string; details: string; date: string }[];
};

export default function CRM() {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [clientMessage, setClientMessage] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const res = await fetch(API.CLIENTS);
        if (res.ok) return res.json();
        return getMockClients();
      } catch {
        return getMockClients();
      }
    },
    staleTime: STALE_TIME_5_MIN,
  });

  const { data: clientDetail } = useQuery({
    queryKey: ['client', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return null;
      try {
        const res = await fetch(`${API.CLIENTS}/${selectedClient.id}`, { credentials: 'include' });
        if (res.ok) return res.json();
        const list = getMockClients() as ClientRecord[];
        const client = list.find((c) => c.id === selectedClient.id);
        const interactions = (getMockInteractions() as { clientId?: string }[]).filter(
          (i) => i.clientId === selectedClient.id
        );
        return client ? { ...client, interactions } : null;
      } catch {
        const list = getMockClients() as ClientRecord[];
        const client = list.find((c) => c.id === selectedClient.id);
        const interactions = (getMockInteractions() as { clientId?: string }[]).filter(
          (i) => i.clientId === selectedClient.id
        );
        return client ? { ...client, interactions } : null;
      }
    },
    enabled: !!selectedClient?.id,
  });

  const {
    data: interactionsData,
    fetchNextPage: fetchMoreInteractions,
    hasNextPage: hasMoreInteractions,
    isFetchingNextPage: isFetchingMoreInteractions,
  } = useInfiniteQuery({
    queryKey: ['client', selectedClient?.id, 'interactions'],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `${API.CLIENTS}/${selectedClient!.id}/interactions?page=${pageParam}&limit=15`,
        { credentials: 'include' }
      );
      if (!res.ok) return { interactions: [], nextPage: null, total: 0 };
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: { nextPage?: number | null }) => lastPage.nextPage ?? undefined,
    enabled: !!selectedClient?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['clients-stats'],
    queryFn: async () => {
      try {
        const res = await fetch(API.CLIENTS_STATS, { credentials: 'include' });
        if (res.ok) return res.json();
        return { statusDistribution: {} as Record<string, number>, interactionsByMonth: [] as { month: string; count: number }[] };
      } catch {
        return { statusDistribution: {} as Record<string, number>, interactionsByMonth: [] as { month: string; count: number }[] };
      }
    },
    staleTime: STALE_TIME_5_MIN,
  });

  const statusChartData = useMemo(() => {
    const dist = stats?.statusDistribution ?? {};
    const labels = CLIENT_STATUSES.map((s) => s.replace(/_/g, ' '));
    const data = CLIENT_STATUSES.map((s) => dist[s] ?? 0);
    return {
      labels,
      datasets: [{ label: 'Clients by status', data, backgroundColor: 'rgba(236, 72, 153, 0.6)' }],
    };
  }, [stats?.statusDistribution]);

  const interactionsOverTimeChartData = useMemo(() => {
    const byMonth = stats?.interactionsByMonth ?? [];
    return {
      labels: byMonth.map((x) => x.month),
      datasets: [{
        label: 'Interactions',
        data: byMonth.map((x) => x.count),
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    };
  }, [stats?.interactionsByMonth]);

  const clientForm = useForm<ClientFormData>({
    defaultValues: { name: '', email: '', phone: '', notes: '', status: 'LEAD' },
    mode: 'onBlur',
  });
  const interactionForm = useForm<InteractionFormData>({
    defaultValues: { type: 'Call', details: '', date: new Date().toISOString().slice(0, 10) },
    mode: 'onBlur',
  });

  const clientCreateMutation = useMutation({
    mutationFn: (data: ClientFormData) =>
      fetch(API.CLIENTS, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-stats'] });
      clientForm.reset({ name: '', email: '', phone: '', notes: '', status: 'LEAD' });
    },
  });

  const clientUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) =>
      fetch(`${API.CLIENTS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-stats'] });
      queryClient.invalidateQueries({ queryKey: ['client', editingClient?.id] });
      if (selectedClient?.id === editingClient?.id) queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });
      setEditingClient(null);
    },
  });

  const clientDeleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`${API.CLIENTS}/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-stats'] });
      if (selectedClient?.id === id) setSelectedClient(null);
      setDeleteConfirm(null);
    },
  });

  const interactionMutation = useMutation({
    mutationFn: (data: InteractionFormData & { clientId: string }) =>
      fetch(API.CLIENTS_INTERACTIONS, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', selectedClient?.id] });
      queryClient.invalidateQueries({ queryKey: ['client', selectedClient?.id, 'interactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients-stats'] });
      interactionForm.reset({
        type: 'Call',
        details: '',
        date: new Date().toISOString().slice(0, 10),
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { toUserId: string; message: string }) =>
      fetch(API.NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify(payload),
        credentials: 'include',
      }),
    onSuccess: () => setClientMessage(''),
  });

  const startEdit = (client: ClientRecord) => {
    setEditingClient(client);
    clientForm.reset({
      name: client.name ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      notes: client.notes ?? '',
      status: client.status ?? 'LEAD',
    });
  };

  const interactionsFromInfinite = interactionsData?.pages?.flatMap((p: { interactions?: { id: string; type: string; details: string; date: string }[] }) => p.interactions ?? []) ?? [];
  const interactions = interactionsFromInfinite.length > 0 ? interactionsFromInfinite : (clientDetail?.interactions ?? []);
  const clientList = clients as ClientRecord[];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.CRM_TITLE}</h1>

        {/* Dashboard charts: memoized from API stats for scalability */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Status distribution</h2>
            <div className="h-[240px]">
              <Bar
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Interactions over time</h2>
            <div className="h-[240px]">
              <Line
                data={interactionsOverTimeChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { display: true }, y: { beginAtZero: true } },
                }}
              />
            </div>
          </div>
        </section>

        {/* Add Client / Edit Client */}
        <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {editingClient ? UI.EDIT_CLIENT : UI.ADD_CLIENT}
          </h2>
          <form
            onSubmit={clientForm.handleSubmit((data) => {
              if (editingClient) {
                clientUpdateMutation.mutate({ id: editingClient.id, data });
              } else {
                clientCreateMutation.mutate(data);
              }
            })}
            className="space-y-4"
          >
            <div>
              <label className="label">{UI.NAME}</label>
              <input {...clientForm.register('name', { required: 'Name is required' })} className="input-field" aria-invalid={!!clientForm.formState.errors.name} />
              {clientForm.formState.errors.name && <p className="text-red-600 text-sm mt-1" role="alert">{clientForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="label">{UI.EMAIL}</label>
              <input type="email" {...clientForm.register('email')} className="input-field" />
            </div>
            <div>
              <label className="label">{UI.PHONE}</label>
              <input type="tel" {...clientForm.register('phone')} className="input-field" />
            </div>
            <div>
              <label className="label">{UI.NOTES}</label>
              <textarea {...clientForm.register('notes')} className="input-field min-h-[80px]" />
            </div>
            <div>
              <label className="label">Status</label>
              <select {...clientForm.register('status', { required: 'Status is required' })} className="input-field" aria-invalid={!!clientForm.formState.errors.status}>
                {CLIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {clientForm.formState.errors.status && <p className="text-red-600 text-sm mt-1" role="alert">{clientForm.formState.errors.status.message}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={clientCreateMutation.isPending || clientUpdateMutation.isPending}>
                {editingClient ? 'Save changes' : UI.ADD_CLIENT}
              </button>
              {editingClient && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingClient(null);
                    clientForm.reset({ name: '', email: '', phone: '', notes: '', status: 'LEAD' });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Clients list */}
        <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{UI.CLIENTS_LIST}</h2>
          {clientList.length === 0 ? (
            <p className="text-slate-500">{UI.NO_CLIENTS}</p>
          ) : (
            <ul className="space-y-2">
              {clientList.map((c) => (
                <li
                  key={c.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedClient?.id === c.id
                      ? 'border-accent-500 bg-accent-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedClient(selectedClient?.id === c.id ? null : c)}
                      className="text-left flex-1 min-w-0"
                    >
                      <span className="font-medium text-slate-900">{c.name ?? '—'}</span>
                      <span className="text-slate-500 text-sm"> — {c.status ?? '—'}</span>
                      {c.email && (
                        <span className="text-slate-500 text-sm block truncate">{c.email}</span>
                      )}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-sm font-medium text-accent-600 hover:text-accent-700"
                      >
                        Edit
                      </button>
                      {deleteConfirm === c.id ? (
                        <>
                          <span className="text-slate-500 text-sm">Delete?</span>
                          <button
                            type="button"
                            onClick={() => clientDeleteMutation.mutate(c.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="text-sm text-slate-500"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(c.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          {UI.DELETE_CLIENT}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Selected client: details + interactions + Add Interaction form */}
        {selectedClient && (
          <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {UI.CLIENT_DETAILS}: {selectedClient.name}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-sm">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-slate-900">{selectedClient.status ?? '—'}</dd>
              <dt className="text-slate-500">{UI.EMAIL}</dt>
              <dd className="text-slate-900">{selectedClient.email ?? '—'}</dd>
              <dt className="text-slate-500">{UI.PHONE}</dt>
              <dd className="text-slate-900">{selectedClient.phone ?? '—'}</dd>
              <dt className="text-slate-500">{UI.NOTES}</dt>
              <dd className="text-slate-900 col-span-2">{selectedClient.notes ?? '—'}</dd>
            </dl>

            {clientDetail?.linkedUserId ? (
              <div className="mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Message client (in-app)</h3>
                <p className="text-sm text-slate-600 mb-3">This client has an account. They will see your message in their Notifications.</p>
                <textarea
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm mb-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (clientMessage.trim()) sendMessageMutation.mutate({ toUserId: clientDetail.linkedUserId!, message: clientMessage.trim() });
                  }}
                  disabled={!clientMessage.trim() || sendMessageMutation.isPending}
                  className="btn-primary text-sm"
                >
                  {sendMessageMutation.isPending ? 'Sending…' : 'Send message'}
                </button>
              </div>
            ) : selectedClient?.email ? (
              <p className="text-sm text-slate-500 mb-6">This client does not have an app account yet (no user with this email). They will see messages here once they sign up.</p>
            ) : null}

            <h3 className="text-lg font-bold text-slate-900 mb-3">Interactions</h3>
            {interactions.length === 0 ? (
              <p className="text-slate-500 text-sm mb-4">No interactions yet.</p>
            ) : (
              <>
                <ul className="space-y-2 mb-4">
                  {interactions.map((i) => (
                    <li key={i.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                      <span className="font-medium text-slate-900">{i.type}</span>
                      <span className="text-slate-500"> — {new Date(i.date).toLocaleDateString()}</span>
                      <p className="text-slate-700 mt-1">{i.details}</p>
                    </li>
                  ))}
                </ul>
                {hasMoreInteractions && (
                  <button
                    type="button"
                    onClick={() => fetchMoreInteractions()}
                    disabled={isFetchingMoreInteractions}
                    className="text-sm font-medium text-accent-600 hover:text-accent-700 disabled:opacity-50 mb-6"
                  >
                    {isFetchingMoreInteractions ? UI.LOADING_MORE : 'Load more interactions'}
                  </button>
                )}
              </>
            )}

            <h3 className="text-lg font-bold text-slate-900 mb-3">{UI.ADD_INTERACTION}</h3>
            <form
              onSubmit={interactionForm.handleSubmit((data) =>
                interactionMutation.mutate({ ...data, clientId: selectedClient.id })
              )}
              className="space-y-4"
            >
              <div>
                <label className="label">{UI.INTERACTION_TYPE}</label>
                <select {...interactionForm.register('type', { required: 'Type is required' })} className="input-field" aria-invalid={!!interactionForm.formState.errors.type}>
                  {INTERACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {interactionForm.formState.errors.type && <p className="text-red-600 text-sm mt-1" role="alert">{interactionForm.formState.errors.type.message}</p>}
              </div>
              <div>
                <label className="label">{UI.INTERACTION_DETAILS}</label>
                <textarea
                  {...interactionForm.register('details', { required: 'Details are required' })}
                  className="input-field min-h-[80px]"
                  aria-invalid={!!interactionForm.formState.errors.details}
                />
                {interactionForm.formState.errors.details && <p className="text-red-600 text-sm mt-1" role="alert">{interactionForm.formState.errors.details.message}</p>}
              </div>
              <div>
                <label className="label">{UI.INTERACTION_DATE}</label>
                <input type="date" {...interactionForm.register('date', { required: 'Date is required' })} className="input-field" aria-invalid={!!interactionForm.formState.errors.date} />
                {interactionForm.formState.errors.date && <p className="text-red-600 text-sm mt-1" role="alert">{interactionForm.formState.errors.date.message}</p>}
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={interactionMutation.isPending}
              >
                {UI.ADD_INTERACTION}
              </button>
            </form>
          </section>
        )}
    </DashboardLayout>
  );
}
