import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNotifications, Notification } from '../../lib/hooks/useNotifications';
import { API, CONTENT_TYPE, UI } from '../../lib/constants';
import DashboardLayout from '../../components/DashboardLayout';
import NotificationDetailDialog from '../../components/NotificationDetailDialog';

/** Group MESSAGE notifications by the other participant (fromUserId) for thread view. */
function groupIntoThreads(notifications: Notification[]): { otherUserId: string; otherUser: { id: string; name: string | null; email: string; role?: string } | null; items: Notification[] }[] {
  const messageNotifs = notifications.filter((n) => n.type === 'MESSAGE' && (n.fromUserId ?? n.fromUser));
  const byOther = new Map<string, Notification[]>();
  for (const n of messageNotifs) {
    const otherId = n.fromUserId ?? n.fromUser?.id ?? '';
    if (!otherId) continue;
    if (!byOther.has(otherId)) byOther.set(otherId, []);
    byOther.get(otherId)!.push(n);
  }
  return Array.from(byOther.entries()).map(([otherUserId, items]) => {
    const sorted = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const first = sorted[0];
    return {
      otherUserId,
      otherUser: first?.fromUser ?? null,
      items: sorted,
    };
  });
}

function MessageCard({
  notif,
  onOpen,
  onMarkRead,
  onToggleFlag,
  isUpdating,
  onAddToCrm,
  addToCrmLoading,
  addedToCrm,
}: {
  notif: Notification;
  onOpen: () => void;
  onMarkRead: () => void;
  onToggleFlag: () => void;
  isUpdating: boolean;
  onAddToCrm?: () => void;
  addToCrmLoading?: boolean;
  addedToCrm?: boolean;
}) {
  const isFromUser = Boolean(notif.fromUser ?? notif.fromUserId);
  const senderLabel = notif.fromUser
    ? (notif.fromUser.name || notif.fromUser.email || 'Another user')
    : null;
  const showAddToCrm = isFromUser && typeof onAddToCrm === 'function';

  return (
    <article
      className={`rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
        !notif.read ? 'border-accent-200 bg-accent-50/20' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 text-left px-4 py-3 hover:bg-slate-50/50 transition-colors min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-slate-800 font-medium line-clamp-2 flex-1">{notif.message}</p>
          {!notif.read && (
            <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-accent-500 mt-1" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-xs text-slate-500">
          <span>{new Date(notif.createdAt).toLocaleString()}</span>
          {notif.type && <span>· {notif.type}</span>}
          {senderLabel && <span>· From {senderLabel}</span>}
        </div>
      </button>
      <div className="flex items-center gap-1 px-3 py-2 border-t border-slate-100 bg-slate-50/50">
        {!notif.read && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
            disabled={isUpdating}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            title="Mark as read"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        {isFromUser && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFlag(); }}
            disabled={isUpdating}
            className={`p-2 rounded-md disabled:opacity-50 ${
              notif.flagged
                ? 'text-amber-600 hover:bg-amber-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
            title={notif.flagged ? 'Unflag' : 'Flag for later'}
          >
            <svg className="w-4 h-4" fill={notif.flagged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        )}
        {isFromUser && !notif.replyText && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="p-2 rounded-md text-slate-500 hover:text-accent-600 hover:bg-accent-50"
            title="Reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        )}
        {showAddToCrm && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToCrm?.(); }}
            disabled={addToCrmLoading || addedToCrm}
            className="p-2 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            title={addedToCrm ? 'Added to CRM' : 'Add to CRM'}
          >
            {addedToCrm ? (
              <span className="text-xs font-medium text-emerald-600">Added</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3z" />
              </svg>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="ml-auto p-2 rounded-md text-slate-500 hover:text-accent-600 hover:bg-accent-50"
          title="View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default function DashboardNotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, status, isRealtor, isBroker } = useAuth();
  const { notifications, markAsRead, reply, setFlagged, updateMutation } = useNotifications();
  const [viewMode, setViewMode] = useState<'all' | 'threads'>('threads');
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [dialogNotificationId, setDialogNotificationId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [addedToCrmIds, setAddedToCrmIds] = useState<Set<string>>(new Set());
  const dialogNotification = dialogNotificationId
    ? notifications.find((n) => n.id === dialogNotificationId) ?? null
    : null;

  const canAddToCrm = isRealtor || isBroker;

  const addToCrmMutation = useMutation({
    mutationFn: (payload: { name: string; email?: string; fromUserId?: string }) =>
      fetch(API.CLIENTS, {
        method: 'POST',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({
          name: payload.name || 'Contact',
          email: payload.email || undefined,
          status: 'LEAD',
        }),
        credentials: 'include',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (variables.fromUserId) setAddedToCrmIds((prev) => new Set(prev).add(variables.fromUserId!));
    },
  });

  const handleAddToCrm = (fromUser: { id: string; name: string | null; email: string }) => {
    addToCrmMutation.mutate({
      name: fromUser.name || fromUser.email || 'Contact',
      email: fromUser.email || undefined,
      fromUserId: fromUser.id,
    });
  };

  const threads = useMemo(() => groupIntoThreads(notifications), [notifications]);
  const otherNotifications = useMemo(
    () => notifications.filter((n) => n.type !== 'MESSAGE' || !(n.fromUserId ?? n.fromUser)),
    [notifications]
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      router.replace('/signin?callbackUrl=/dashboard/notifications');
      return;
    }
  }, [status, isAuthenticated, router]);

  const openDialog = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id);
    setDialogNotificationId(notif.id);
  };

  const handleReply = (replyText: string) => {
    if (!dialogNotificationId || !replyText.trim()) return;
    reply(dialogNotificationId, replyText.trim());
    setReplyDraft((prev) => ({ ...prev, [dialogNotificationId]: '' }));
    setDialogNotificationId(null);
  };

  if (status === 'loading' || !isAuthenticated) {
    return (
      <DashboardLayout>
        <p className="text-slate-500 py-8">{status === 'loading' ? UI.LOADING : 'Redirecting…'}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Notifications</h1>
        <p className="text-slate-500 text-sm mb-4">View and manage your messages</p>
        {notifications.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setViewMode('threads')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${viewMode === 'threads' ? 'bg-accent-100 text-accent-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Threads
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${viewMode === 'all' ? 'bg-accent-100 text-accent-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All
            </button>
          </div>
        )}
        {notifications.length === 0 ? (
          <p className="text-slate-500 py-12">{UI.NO_NOTIFICATIONS}</p>
        ) : viewMode === 'threads' && threads.length > 0 ? (
          <div className="space-y-3">
            {threads.map((thread) => {
              const otherName = thread.otherUser?.name || thread.otherUser?.email || 'Unknown';
              const latest = thread.items[thread.items.length - 1];
              const isExpanded = expandedThreadId === thread.otherUserId;
              const unreadInThread = thread.items.filter((n) => !n.read).length;
              return (
                <div
                  key={thread.otherUserId}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedThreadId(isExpanded ? null : thread.otherUserId)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900">{otherName}</span>
                      {unreadInThread > 0 && (
                        <span className="ml-2 text-xs font-medium text-accent-600">({unreadInThread} new)</span>
                      )}
                      <p className="text-sm text-slate-500 truncate mt-0.5">{latest?.message}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {latest ? new Date(latest.createdAt).toLocaleString() : ''}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/30 px-4 py-3">
                      <ul className="space-y-3 mb-4">
                        {thread.items.map((n) => (
                          <li key={n.id} className="space-y-1">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-slate-500 shrink-0">{otherName}:</span>
                              <p className="text-slate-800 text-sm">{n.message}</p>
                            </div>
                            {n.replyText && (
                              <div className="ml-4 pl-3 border-l-2 border-accent-200">
                                <span className="text-xs font-medium text-accent-600">You: </span>
                                <span className="text-slate-700 text-sm">{n.replyText}</span>
                                {n.repliedAt && (
                                  <span className="text-xs text-slate-400 block mt-0.5">
                                    {new Date(n.repliedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDialog(latest)}
                          className="px-3 py-1.5 rounded-md bg-accent-600 text-white text-sm font-medium hover:bg-accent-700"
                        >
                          Reply
                        </button>
                        {canAddToCrm && thread.otherUser && thread.otherUser.role === 'USER' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAddToCrm({ id: thread.otherUserId, name: thread.otherUser?.name ?? null, email: thread.otherUser?.email ?? '' }); }}
                            disabled={addToCrmMutation.isPending || addedToCrmIds.has(thread.otherUserId)}
                            className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {addedToCrmIds.has(thread.otherUserId) ? 'Added to CRM' : addToCrmMutation.isPending ? 'Adding…' : 'Add to CRM'}
                          </button>
                        )}
                        {thread.items.some((n) => !n.read) && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); thread.items.forEach((n) => { if (!n.read) markAsRead(n.id); }); }}
                            className="text-sm text-slate-600 hover:text-slate-800"
                          >
                            Mark thread as read
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {otherNotifications.length > 0 && (
              <div className="pt-4">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Other notifications</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherNotifications.map((notif) => (
                    <MessageCard
                      key={notif.id}
                      notif={notif}
                      onOpen={() => openDialog(notif)}
                      onMarkRead={() => markAsRead(notif.id)}
                      onToggleFlag={() => setFlagged(notif.id, !notif.flagged)}
                      isUpdating={updateMutation.isPending}
                      onAddToCrm={canAddToCrm && notif.fromUser && notif.fromUser.role === 'USER' ? () => handleAddToCrm({ id: notif.fromUserId ?? notif.fromUser!.id, name: notif.fromUser!.name ?? null, email: notif.fromUser!.email ?? '' }) : undefined}
                      addToCrmLoading={addToCrmMutation.isPending}
                      addedToCrm={canAddToCrm && notif.fromUser?.role === 'USER' && (notif.fromUserId || notif.fromUser?.id) ? addedToCrmIds.has(notif.fromUserId ?? notif.fromUser!.id) : false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.map((notif) => (
              <MessageCard
                key={notif.id}
                notif={notif}
                onOpen={() => openDialog(notif)}
                onMarkRead={() => markAsRead(notif.id)}
                onToggleFlag={() => setFlagged(notif.id, !notif.flagged)}
                isUpdating={updateMutation.isPending}
                onAddToCrm={canAddToCrm && notif.fromUser && notif.fromUser.role === 'USER' ? () => handleAddToCrm({ id: notif.fromUserId ?? notif.fromUser!.id, name: notif.fromUser!.name ?? null, email: notif.fromUser!.email ?? '' }) : undefined}
                addToCrmLoading={addToCrmMutation.isPending}
                addedToCrm={canAddToCrm && notif.fromUser?.role === 'USER' && (notif.fromUserId || notif.fromUser?.id) ? addedToCrmIds.has(notif.fromUserId ?? notif.fromUser!.id) : false}
              />
            ))}
          </div>
        )}
      </div>
      {dialogNotification && (
        <NotificationDetailDialog
          notification={dialogNotification}
          onClose={() => setDialogNotificationId(null)}
          replyDraft={replyDraft[dialogNotification.id] ?? ''}
          onReplyDraftChange={(value) =>
            setReplyDraft((prev) => ({ ...prev, [dialogNotification.id]: value }))
          }
          onReply={handleReply}
          isReplySubmitting={updateMutation.isPending}
          onToggleFlag={() =>
            setFlagged(dialogNotification.id, !dialogNotification.flagged)
          }
        />
      )}
    </DashboardLayout>
  );
}
