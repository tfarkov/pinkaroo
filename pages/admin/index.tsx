import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { API, CONTENT_TYPE, UI } from '../../lib/constants';
import { getMockRealtors, getMockBrokers } from '../../lib/mockData';
import { useAuth } from '../../lib/hooks/useAuth';
import DashboardLayout from '../../components/DashboardLayout';

type UserOption = { id: string; name: string | null; email: string; role: string };

export default function AdminPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin, canEditRealtorProfiles, status } = useAuth();
  const [messageUserId, setMessageUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

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
  const { data: allUsers = [] } = useQuery<UserOption[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch(API.ADMIN_USERS, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
  });
  const { register, handleSubmit, formState: { errors } } = useForm<{ realtorId: string; brokerId: string }>({ mode: 'onBlur' });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { toUserId: string; message: string }) =>
      fetch(API.NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify(payload),
        credentials: 'include',
      }),
    onSuccess: () => {
      setMessageText('');
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 3000);
    },
  });

  const mutation = useMutation({
    mutationFn: ({ realtorId, brokerId }: { realtorId: string; brokerId: string }) => fetch(API.ADMIN_ASSIGN_BROKER, { method: 'POST', body: JSON.stringify({ realtorId, brokerId }), headers: { 'Content-Type': CONTENT_TYPE.JSON }, credentials: 'include' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['realtors'] }); queryClient.invalidateQueries({ queryKey: ['brokers'] }); },
  });

  const showAdminOnlySections = isAdmin && status === 'authenticated';

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.ADMIN_DASHBOARD}</h1>
        {showAdminOnlySections && (
        <>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Message user</h2>
          <p className="text-slate-600 text-sm mb-4">Send an in-app message to any signed-up user. They will see it in their Notifications.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!messageUserId) return;
              if (!messageText.trim()) return;
              sendMessageMutation.mutate({ toUserId: messageUserId, message: messageText.trim() });
            }}
            className="flex flex-wrap gap-4 items-end"
          >
            <div className="min-w-[220px]">
              <label className="label">User</label>
              <select
                value={messageUserId}
                onChange={(e) => setMessageUserId(e.target.value)}
                className="input-field"
                required
                aria-required="true"
              >
                <option value="">Select a user</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email || u.id} ({u.role}) {u.email && ` · ${u.email}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label">Message</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="input-field w-full min-h-[72px]"
                required
                aria-required="true"
              />
            </div>
            <button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="btn-primary"
            >
              {sendMessageMutation.isPending ? 'Sending…' : messageSent ? 'Sent' : 'Send message'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{UI.ASSIGN_REALTOR_TO_BROKER}</h2>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
              <label className="label">Realtor</label>
              <select {...register('realtorId', { required: 'Please select a realtor' })} className="input-field" aria-invalid={!!errors.realtorId}>
                {realtors.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.realtorId && <p className="text-red-600 text-sm mt-1" role="alert">{errors.realtorId.message}</p>}
            </div>
            <div className="min-w-[200px]">
              <label className="label">Broker</label>
              <select {...register('brokerId', { required: 'Please select a broker' })} className="input-field" aria-invalid={!!errors.brokerId}>
                {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.brokerId && <p className="text-red-600 text-sm mt-1" role="alert">{errors.brokerId.message}</p>}
            </div>
            <button type="submit" className="btn-primary">{UI.ASSIGN}</button>
          </form>
        </div>
        </>
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
