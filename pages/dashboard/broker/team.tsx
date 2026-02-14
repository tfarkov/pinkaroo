import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../lib/hooks/useAuth';
import { API, CONTENT_TYPE, UI } from '../../../lib/constants';
import { getMockRealtors, getMockTeams } from '../../../lib/mockData';
import DashboardLayout from '../../../components/DashboardLayout';

type Team = { id: string; name: string; brokerId: string; members?: { id: string }[] };
type TeamMember = {
  id: string;
  name?: string | null;
  email?: string | null;
  isTeamLead?: boolean | null;
  brokerId?: string | null;
  teamId?: string | null;
  team?: { id: string; name: string } | null;
};

export default function BrokerTeamPage() {
  const { isBroker } = useAuth();
  const queryClient = useQueryClient();
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['broker-teams'],
    queryFn: async () => {
      try {
        const res = await fetch(API.BROKER_TEAMS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockTeams();
      } catch {
        return getMockTeams();
      }
    },
    enabled: isBroker,
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['broker-team'],
    queryFn: async () => {
      try {
        const res = await fetch(API.ADMIN_REALTORS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockRealtors();
      } catch {
        return getMockRealtors();
      }
    },
    enabled: isBroker,
  });

  const createTeamMutation = useMutation({
    mutationFn: (name: string) =>
      fetch(API.BROKER_TEAMS, {
        method: 'POST',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ name }),
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-teams'] });
      setNewTeamName('');
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fetch(`${API.BROKER_TEAMS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ name }),
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-teams'] });
      setEditingTeamId(null);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API.BROKER_TEAMS}/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-teams'] });
      queryClient.invalidateQueries({ queryKey: ['broker-team'] });
      setDeleteConfirmId(null);
    },
  });

  const updateRealtorMutation = useMutation({
    mutationFn: ({ id, isTeamLead, teamId }: { id: string; isTeamLead?: boolean; teamId?: string | null }) =>
      fetch(`${API.USERS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ isTeamLead, teamId }),
        credentials: 'include',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-team'] }),
  });

  if (!isBroker) {
    return (
      <DashboardLayout>
        <div className="py-20 flex items-center justify-center">
          <p className="text-slate-600 font-medium">{UI.ACCESS_DENIED}</p>
        </div>
      </DashboardLayout>
    );
  }

  const teamList = teams as Team[];
  const membersList = teamMembers as TeamMember[];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.BROKER_TEAM_TITLE}</h1>
      <p className="text-slate-600 mb-8 max-w-2xl">{UI.BROKER_TEAM_DESCRIPTION}</p>

      {/* Teams */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Teams</h2>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div className="min-w-[200px]">
            <label className="label">{UI.TEAM_NAME}</label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Barrie Office"
              className="input-field"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (newTeamName.trim()) createTeamMutation.mutate(newTeamName.trim());
            }}
            disabled={!newTeamName.trim() || createTeamMutation.isPending}
            className="btn-primary"
          >
            {UI.ADD_TEAM}
          </button>
        </div>
        {teamsLoading ? (
          <p className="text-slate-500">{UI.LOADING}</p>
        ) : teamList.length === 0 ? (
          <p className="text-slate-500 text-sm">No teams yet. Add a team above.</p>
        ) : (
          <ul className="space-y-2">
            {teamList.map((team) => (
              <li
                key={team.id}
                className="flex flex-wrap items-center gap-3 py-2 px-4 rounded-lg border border-slate-200 bg-white"
              >
                {editingTeamId === team.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTeamName}
                      onChange={(e) => setEditingTeamName(e.target.value)}
                      className="input-field flex-1 min-w-0 max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateTeamMutation.mutate({ id: team.id, name: editingTeamName.trim() })}
                      disabled={!editingTeamName.trim()}
                      className="btn-primary text-sm"
                    >
                      {UI.SAVE}
                    </button>
                    <button type="button" onClick={() => setEditingTeamId(null)} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-slate-900">{team.name}</span>
                    <span className="text-slate-500 text-sm">
                      ({team.members?.length ?? 0} member{(team.members?.length ?? 0) !== 1 ? 's' : ''})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(team.id);
                        setEditingTeamName(team.name);
                      }}
                      className="text-sm text-accent-600 hover:underline"
                    >
                      Edit
                    </button>
                    {deleteConfirmId === team.id ? (
                      <>
                        <span className="text-slate-500 text-sm">Delete?</span>
                        <button
                          type="button"
                          onClick={() => deleteTeamMutation.mutate(team.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Yes
                        </button>
                        <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-sm text-slate-500">
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(team.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        {UI.DELETE_TEAM}
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Realtors */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">{UI.REALTORS_LIST}</h2>
        {membersLoading ? (
          <p className="text-slate-500">{UI.LOADING}</p>
        ) : membersList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-8 text-center">
            <p className="text-slate-500">{UI.NO_TEAM_MEMBERS}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-slate-700 font-semibold">{UI.NAME}</th>
                    <th className="text-left p-4 text-slate-700 font-semibold">{UI.EMAIL}</th>
                    <th className="text-left p-4 text-slate-700 font-semibold">{UI.ASSIGN_TO_TEAM}</th>
                    <th className="text-left p-4 text-slate-700 font-semibold">{UI.TEAM_LEAD}</th>
                  </tr>
                </thead>
                <tbody>
                  {membersList.map((member) => (
                    <tr key={member.id} className="border-t border-slate-200 hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">{member.name ?? '—'}</td>
                      <td className="p-4 text-slate-600">{member.email ?? '—'}</td>
                      <td className="p-4">
                        <select
                          value={member.teamId ?? ''}
                          onChange={(e) =>
                            updateRealtorMutation.mutate({
                              id: member.id,
                              teamId: e.target.value || null,
                            })
                          }
                          className="input-field py-2 min-w-[140px]"
                        >
                          <option value="">{UI.NO_TEAM}</option>
                          {teamList.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!member.isTeamLead}
                            onChange={(e) =>
                              updateRealtorMutation.mutate({ id: member.id, isTeamLead: e.target.checked })
                            }
                            disabled={updateRealtorMutation.isPending}
                            className="rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                          />
                          <span className="text-sm text-slate-700">Team lead</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
