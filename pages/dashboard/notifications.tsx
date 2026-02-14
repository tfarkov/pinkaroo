import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNotifications, Notification } from '../../lib/hooks/useNotifications';
import { UI } from '../../lib/constants';
import DashboardLayout from '../../components/DashboardLayout';
import NotificationDetailDialog from '../../components/NotificationDetailDialog';

function MessageCard({
  notif,
  onOpen,
  onMarkRead,
  onToggleFlag,
  isUpdating,
}: {
  notif: Notification;
  onOpen: () => void;
  onMarkRead: () => void;
  onToggleFlag: () => void;
  isUpdating: boolean;
}) {
  const isFromUser = Boolean(notif.fromUser ?? notif.fromUserId);
  const senderLabel = notif.fromUser
    ? (notif.fromUser.name || notif.fromUser.email || 'Another user')
    : null;

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
  const { isAuthenticated, status } = useAuth();
  const { notifications, markAsRead, reply, setFlagged, updateMutation } = useNotifications();
  const [dialogNotificationId, setDialogNotificationId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const dialogNotification = dialogNotificationId
    ? notifications.find((n) => n.id === dialogNotificationId) ?? null
    : null;

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
        <p className="text-slate-500 text-sm mb-6">View and manage your messages</p>
        {notifications.length === 0 ? (
          <p className="text-slate-500 py-12">{UI.NO_NOTIFICATIONS}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.map((notif) => (
              <MessageCard
                key={notif.id}
                notif={notif}
                onOpen={() => openDialog(notif)}
                onMarkRead={() => markAsRead(notif.id)}
                onToggleFlag={() => setFlagged(notif.id, !notif.flagged)}
                isUpdating={updateMutation.isLoading}
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
          isReplySubmitting={updateMutation.isLoading}
          onToggleFlag={() =>
            setFlagged(dialogNotification.id, !dialogNotification.flagged)
          }
        />
      )}
    </DashboardLayout>
  );
}
