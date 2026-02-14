import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useNotifications, Notification } from '../lib/hooks/useNotifications';
import { UI } from '../lib/constants';
import NotificationDetailDialog from './NotificationDetailDialog';

export default function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, reply, setFlagged, updateMutation } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [dialogNotificationId, setDialogNotificationId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogNotification = dialogNotificationId
    ? notifications.find((n) => n.id === dialogNotificationId) ?? null
    : null;

  useEffect(() => {
    if (!isOpen) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [isOpen]);

  const openDialog = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id);
    setDialogNotificationId(notif.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-2 rounded-md text-white hover:bg-white/10 relative"
        aria-label={UI.NOTIFICATIONS}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-accent-500 rounded-full" />}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-card-hover border border-slate-200 py-2 px-0 max-h-80 overflow-y-auto z-50" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-900 text-sm">{UI.NOTIFICATIONS}</span>
            <Link href="/dashboard/notifications" className="text-accent-600 hover:text-accent-700 text-sm font-medium" onClick={() => setIsOpen(false)}>
              View all
            </Link>
          </div>
          {notifications.slice(0, 5).map((notif) => (
            <button
              key={notif.id}
              type="button"
              onClick={() => openDialog(notif)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-0"
            >
              {notif.message}
              <span className="block text-xs text-slate-500 mt-0.5">{new Date(notif.createdAt).toLocaleString()}</span>
            </button>
          ))}
          {notifications.length === 0 && <p className="px-4 py-5 text-slate-500 text-sm">{UI.NO_NOTIFICATIONS}</p>}
          {notifications.length > 5 && (
            <div className="px-4 py-2 border-t border-slate-100">
              <Link href="/dashboard/notifications" className="text-accent-600 hover:text-accent-700 text-sm font-medium" onClick={() => setIsOpen(false)}>
                View all ({notifications.length})
              </Link>
            </div>
          )}
        </div>
      )}
      {dialogNotification && (
        <NotificationDetailDialog
          notification={dialogNotification}
          onClose={() => setDialogNotificationId(null)}
          replyDraft={replyDraft[dialogNotification.id] ?? ''}
          onReplyDraftChange={(value) =>
            setReplyDraft((prev) => ({ ...prev, [dialogNotification.id]: value }))
          }
          onReply={(text) => {
            reply(dialogNotification.id, text);
            setReplyDraft((prev) => ({ ...prev, [dialogNotification.id]: '' }));
            setDialogNotificationId(null);
          }}
          isReplySubmitting={updateMutation.isLoading}
          onToggleFlag={() =>
            setFlagged(dialogNotification.id, !dialogNotification.flagged)
          }
        />
      )}
    </div>
  );
}
