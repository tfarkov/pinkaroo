import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { API, CLIENT_STATUSES, CONTENT_TYPE, STALE_TIME_5_MIN, UI } from '../../lib/constants';
import Header from '../../components/Header';
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
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => fetch(API.CLIENTS).then(res => res.json()), staleTime: STALE_TIME_5_MIN });
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
    <div>
      <Header />
      <main className="p-4 max-w-5xl mx-auto pb-16 md:pb-0">
        <h1 className="text-3xl mb-4">{UI.CRM_TITLE}</h1>
        <form onSubmit={clientForm.handleSubmit((data) => clientMutation.mutate(data))} className="space-y-4 mb-8">
          <input {...clientForm.register('name')} placeholder={UI.NAME} required className="border p-2 w-full" />
          <input {...clientForm.register('email')} placeholder="Email" className="border p-2 w-full" />
          <input {...clientForm.register('phone')} placeholder="Phone" className="border p-2 w-full" />
          <textarea {...clientForm.register('notes')} placeholder="Notes" className="border p-2 w-full" />
          <select {...clientForm.register('status')} required className="border p-2 w-full">
            {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="bg-pink-500 text-white p-2 rounded w-full">{UI.ADD_CLIENT}</button>
        </form>
        <ul className="space-y-2">
          {clients.map(c => (
            <li key={c.id} onClick={() => setSelectedClient(c)} className="cursor-pointer border p-2 rounded hover:bg-pink-100">
              {c.name} - {c.status}
            </li>
          ))}
        </ul>
        {selectedClient && (
          <div className="mt-8">
            <h2 className="text-2xl mb-4">Interactions for {selectedClient.name}</h2>
            <form onSubmit={interactionForm.handleSubmit((data) => interactionMutation.mutate(data))} className="space-y-4">
              <input {...interactionForm.register('type')} placeholder="Type (e.g., Call)" required className="border p-2 w-full" />
              <textarea {...interactionForm.register('details')} placeholder="Details" required className="border p-2 w-full" />
              <input type="date" {...interactionForm.register('date')} required className="border p-2 w-full" />
              <button type="submit" className="bg-pink-500 text-white p-2 rounded w-full">Add Interaction</button>
            </form>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
