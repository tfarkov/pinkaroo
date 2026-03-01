import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/hooks/useAuth';
import { useNotifications, Notification } from '../lib/hooks/useNotifications';
import { UI } from '../lib/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import NotificationDetailDialog from '../components/NotificationDetailDialog';

export default function NotificationsPage() {
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
      router.replace('/signin?callbackUrl=/notifications');
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
      <div className="page-container flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 content-width py-12 flex items-center justify-center">
          <p className="text-slate-500">{status === 'loading' ? UI.LOADING : 'Redirecting…'}</p>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 content-width py-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{UI.NOTIFICATIONS}</h1>
        </div>
        {notifications.length === 0 ? (
          <p className="text-slate-500 py-8">{UI.NO_NOTIFICATIONS}</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`rounded-lg border bg-white shadow-sm overflow-hidden ${!notif.read ? 'border-accent-200 bg-accent-50/30' : 'border-slate-200'}`}
              >
                <button
                  type="button"
                  onClick={() => openDialog(notif)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-800 font-medium flex-1">{notif.message}</p>
                    {!notif.read && <span className="shrink-0 w-2 h-2 rounded-full bg-accent-500 mt-1.5" aria-hidden />}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {new Date(notif.createdAt).toLocaleString()}
                    {notif.type && ` · ${notif.type}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
      <BottomNav />
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
    </div>
  );
}
