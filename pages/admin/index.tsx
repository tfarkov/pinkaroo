import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { API, CONTENT_TYPE, UI } from '../../lib/constants';
import Header from '../../components/Header';
import BottomNav from '../../components/ui/BottomNav';

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const { data: realtors = [] } = useQuery({ queryKey: ['realtors'], queryFn: () => fetch(API.ADMIN_REALTORS).then(res => res.json()) });
  const { data: brokers = [] } = useQuery({ queryKey: ['brokers'], queryFn: () => fetch(API.ADMIN_BROKERS).then(res => res.json()) });
  const { register, handleSubmit } = useForm<{ realtorId: string; brokerId: string }>();

  const mutation = useMutation({
    mutationFn: ({ realtorId, brokerId }: { realtorId: string; brokerId: string }) => fetch(API.ADMIN_ASSIGN_BROKER, { method: 'POST', body: JSON.stringify({ realtorId, brokerId }), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['realtors'] }); queryClient.invalidateQueries({ queryKey: ['brokers'] }); },
  });

  return (
    <div className="page-container">
      <Header />
      <main className="content-width max-w-5xl pb-16 md:pb-8">
        <h1 className="text-3xl font-bold text-primary-900 py-6">{UI.ADMIN_DASHBOARD}</h1>
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">{UI.ASSIGN_REALTOR_TO_BROKER}</h2>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
              <label className="label">Realtor</label>
              <select {...register('realtorId')} required className="input-field">
                {realtors.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="label">Broker</label>
              <select {...register('brokerId')} required className="input-field">
                {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary">{UI.ASSIGN}</button>
          </form>
        </div>
        <h2 className="section-heading">{UI.REALTORS_LIST}</h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left p-3 text-primary-700 font-medium">Name</th>
                <th className="text-left p-3 text-primary-700 font-medium">Broker</th>
              </tr>
            </thead>
            <tbody>
              {realtors.map(r => (
                <tr key={r.id} className="border-t border-primary-100">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.broker?.name || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="section-heading mt-8">{UI.BROKERS_LIST}</h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left p-3 text-primary-700 font-medium">Name</th>
                <th className="text-left p-3 text-primary-700 font-medium">Team Size</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map(b => (
                <tr key={b.id} className="border-t border-primary-100">
                  <td className="p-3">{b.name}</td>
                  <td className="p-3">{b.teamMembers?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
