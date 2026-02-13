import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { API, CLIENT_STATUSES, CONTENT_TYPE, STALE_TIME_5_MIN, UI } from '../../lib/constants';
import { getMockClients } from '../../lib/mockData';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/ui/BottomNav';

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
  date: Date;
}

export default function CRM() {
  const queryClient = useQueryClient();
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
  const [selectedClient, setSelectedClient] = useState(null);
  const clientForm = useForm<ClientFormData>();
  const interactionForm = useForm<InteractionFormData>();

  const clientMutation = useMutation({
    mutationFn: (data: ClientFormData) => fetch(API.CLIENTS, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const interactionMutation = useMutation({
    mutationFn: (data: InteractionFormData) => fetch(API.CLIENTS_INTERACTIONS, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width max-w-5xl mx-auto pb-14 md:pb-8">
        <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.CRM_TITLE}</h1>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="section-heading">{UI.ADD_CLIENT}</h2>
          <form onSubmit={clientForm.handleSubmit((data) => clientMutation.mutate(data))} className="space-y-4">
            <input {...clientForm.register('name')} placeholder={UI.NAME} required className="input-field" />
            <input {...clientForm.register('email')} placeholder="Email" className="input-field" />
            <input {...clientForm.register('phone')} placeholder="Phone" className="input-field" />
            <textarea {...clientForm.register('notes')} placeholder="Notes" className="input-field min-h-[80px]" />
            <select {...clientForm.register('status')} required className="input-field">
              {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="submit" className="btn-primary w-full">{UI.ADD_CLIENT}</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="section-heading">Clients</h2>
          <ul className="space-y-2">
            {clients.map(c => (
              <li key={c.id} onClick={() => setSelectedClient(c)} className="cursor-pointer border border-slate-200 p-4 rounded-lg hover:bg-slate-50 hover:border-accent-200 transition-colors">
                <span className="font-medium text-slate-900">{c.name}</span>
                <span className="text-slate-600"> — {c.status}</span>
              </li>
            ))}
          </ul>
        </div>

        {selectedClient && (
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Interactions for {selectedClient.name}</h2>
            <form onSubmit={interactionForm.handleSubmit((data) => interactionMutation.mutate(data))} className="space-y-4">
              <input {...interactionForm.register('type')} placeholder="Type (e.g., Call)" required className="input-field" />
              <textarea {...interactionForm.register('details')} placeholder="Details" required className="input-field min-h-[80px]" />
              <input type="date" {...interactionForm.register('date')} required className="input-field" />
              <button type="submit" className="btn-primary w-full">Add Interaction</button>
            </form>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
