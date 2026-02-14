import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { API, CONTENT_TYPE, UI } from '../../lib/constants';
import { getMockRealtors, getMockBrokers } from '../../lib/mockData';
import { useAuth } from '../../lib/hooks/useAuth';
import DashboardLayout from '../../components/DashboardLayout';

export default function AdminPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin, canEditRealtorProfiles, status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/api/auth/signin');
    else if (status === 'authenticated' && !canEditRealtorProfiles) router.replace('/');
  }, [status, canEditRealtorProfiles, router]);

  const { data: realtors = [] } = useQuery({
    queryKey: ['realtors'],
    queryFn: async () => {
      try {
        const res = await fetch(API.ADMIN_REALTORS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockRealtors();
      } catch {
        return getMockRealtors();
      }
    },
    enabled: canEditRealtorProfiles,
  });
  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers'],
    queryFn: async () => {
      try {
        const res = await fetch(API.ADMIN_BROKERS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockBrokers();
      } catch {
        return getMockBrokers();
      }
    },
    enabled: isAdmin,
  });
  const { register, handleSubmit } = useForm<{ realtorId: string; brokerId: string }>();

  const mutation = useMutation({
    mutationFn: ({ realtorId, brokerId }: { realtorId: string; brokerId: string }) => fetch(API.ADMIN_ASSIGN_BROKER, { method: 'POST', body: JSON.stringify({ realtorId, brokerId }), headers: { 'Content-Type': CONTENT_TYPE.JSON }, credentials: 'include' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['realtors'] }); queryClient.invalidateQueries({ queryKey: ['brokers'] }); },
  });

  const showAdminOnlySections = isAdmin && status === 'authenticated';

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.ADMIN_DASHBOARD}</h1>
        {showAdminOnlySections && (
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{UI.ASSIGN_REALTOR_TO_BROKER}</h2>
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
        )}
        <h2 className="section-heading">{UI.REALTORS_LIST}</h2>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-slate-700 font-semibold">Name</th>
                <th className="text-left p-3 text-slate-700 font-semibold">Broker</th>
                <th className="text-left p-3 text-slate-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {realtors.map(r => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="p-3 text-slate-900">{r.name}</td>
                  <td className="p-3 text-slate-900">{r.broker?.name || 'None'}</td>
                  <td className="p-3">
                    <Link href={`/admin/realtors/${r.id}`} className="text-accent-600 hover:underline font-medium text-sm">
                      Edit profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showAdminOnlySections && (
        <>
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">{UI.BROKERS_LIST}</h2>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-slate-700 font-semibold">Name</th>
                <th className="text-left p-3 text-slate-700 font-semibold">Team Size</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map(b => (
                <tr key={b.id} className="border-t border-slate-200">
                  <td className="p-3 text-slate-900">{b.name}</td>
                  <td className="p-3 text-slate-900">{b.teamMembers?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
    </DashboardLayout>
  );
}
