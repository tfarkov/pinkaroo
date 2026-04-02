import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, CONTENT_TYPE, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function SystemAdminDashboardPage() {
  const { isSystemAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [permissionPayload, setPermissionPayload] = useState(
    JSON.stringify({
      SYSTEM_ADMIN: ['*'],
      OFFICE_ADMIN: ['manage:brokers', 'manage:realtors', 'view:operational_dashboards'],
    }, null, 2)
  );

  const { data: settingsData } = useQuery({
    queryKey: ['system-admin-settings'],
    queryFn: async () => {
      const res = await fetch(API.SYSTEM_ADMIN_SETTINGS, { credentials: 'include' });
      if (!res.ok) return { settings: [] };
      return res.json();
    },
    enabled: isSystemAdmin,
  });
  const { data: permissionsData } = useQuery({
    queryKey: ['system-admin-permissions'],
    queryFn: async () => {
      const res = await fetch(API.SYSTEM_ADMIN_PERMISSIONS, { credentials: 'include' });
      if (!res.ok) return { permissions: {} };
      return res.json();
    },
    enabled: isSystemAdmin,
  });
  const { data: auditData } = useQuery({
    queryKey: ['system-admin-audit'],
    queryFn: async () => {
      const res = await fetch(API.SYSTEM_ADMIN_AUDIT, { credentials: 'include' });
      if (!res.ok) return { logs: [] };
      return res.json();
    },
    enabled: isSystemAdmin,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.SYSTEM_ADMIN_SETTINGS, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ key: settingKey, value: settingValue }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setSettingKey('');
      setSettingValue('');
      queryClient.invalidateQueries({ queryKey: ['system-admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-admin-audit'] });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(permissionPayload);
      const res = await fetch(API.SYSTEM_ADMIN_PERMISSIONS, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ permissions: parsed, reason: 'Updated from system admin dashboard' }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['system-admin-audit'] });
    },
  });

  if (!isSystemAdmin) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  const settings = (settingsData?.settings ?? []) as { id: string; key: string; value?: string | null }[];
  const logs = (auditData?.logs ?? []) as { id: string; action?: string; entityType?: string; createdAt?: string; actor?: { name?: string; email?: string } }[];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.ADMIN_DASHBOARD}</h1>
      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">App settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input value={settingKey} onChange={(e) => setSettingKey(e.target.value)} className="input-field" placeholder="Setting key" />
          <input value={settingValue} onChange={(e) => setSettingValue(e.target.value)} className="input-field" placeholder="Setting value" />
          <button type="button" className="btn-primary" disabled={!settingKey.trim() || updateSettingMutation.isPending} onClick={() => updateSettingMutation.mutate()}>
            {updateSettingMutation.isPending ? 'Saving...' : 'Save setting'}
          </button>
        </div>
        <ul className="space-y-2">
          {settings.map((setting) => (
            <li key={setting.id} className="border border-slate-200 rounded-md p-3 text-sm">
              <span className="font-medium text-slate-900">{setting.key}</span>
              <span className="text-slate-600"> · {setting.value ?? '(null)'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Permission policies</h2>
        <textarea value={permissionPayload} onChange={(e) => setPermissionPayload(e.target.value)} className="input-field w-full min-h-[220px] mb-3 font-mono text-xs" />
        <button type="button" className="btn-primary" onClick={() => updatePermissionsMutation.mutate()} disabled={updatePermissionsMutation.isPending}>
          {updatePermissionsMutation.isPending ? 'Updating...' : 'Update permissions'}
        </button>
        <p className="text-xs text-slate-500 mt-2">Current server policy: {JSON.stringify(permissionsData?.permissions ?? {})}</p>
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Governance audit log</h2>
        <ul className="space-y-2">
          {logs.length === 0 && <li className="text-slate-500 text-sm">No audit logs yet.</li>}
          {logs.slice(0, 100).map((log) => (
            <li key={log.id} className="border border-slate-200 rounded-md p-3 text-sm">
              <span className="font-medium text-slate-900">{log.action ?? 'Unknown action'}</span>
              <span className="text-slate-600"> · {log.entityType ?? 'Entity'} · {log.actor?.name ?? log.actor?.email ?? 'Unknown actor'}</span>
              <div className="text-xs text-slate-500 mt-1">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</div>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}
