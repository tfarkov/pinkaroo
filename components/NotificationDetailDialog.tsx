import React, { useEffect } from 'react';
import { Notification } from '../lib/hooks/useNotifications';

type Props = {
  notification: Notification | null;
  onClose: () => void;
  /** When provided, show reply section (form or existing reply) */
  replyDraft?: string;
  onReplyDraftChange?: (value: string) => void;
  onReply?: (replyText: string) => void;
  isReplySubmitting?: boolean;
  /** When provided and notification is from a user, show flag toggle */
  onToggleFlag?: () => void;
};

export default function NotificationDetailDialog({
  notification,
  onClose,
  replyDraft = '',
  onReplyDraftChange,
  onReply,
  isReplySubmitting = false,
  onToggleFlag,
}: Props) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!notification) return null;

  const isFromUser = Boolean(notification.fromUser ?? notification.fromUserId);
  const senderLabel = notification.fromUser
    ? (notification.fromUser.name || notification.fromUser.email || 'Another user')
    : null;
  const hasReplySupport = typeof onReply === 'function';
  const canSubmitReply = hasReplySupport && replyDraft.trim() && !isReplySubmitting;
  const showReplySection = isFromUser && hasReplySupport && !notification.replyText;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-dialog-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] flex flex-col bg-white rounded-xl shadow-xl border border-slate-200 z-[101]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 id="notification-dialog-title" className="text-lg font-semibold text-slate-900">
            {isFromUser && senderLabel ? `Message from ${senderLabel}` : 'Notification'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 flex-1">
          <p className="text-slate-800 whitespace-pre-wrap">{notification.message}</p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{new Date(notification.createdAt).toLocaleString()}</span>
            {notification.type && <span>{notification.type}</span>}
          </div>
          {isFromUser && typeof onToggleFlag === 'function' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onToggleFlag}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  notification.flagged
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {notification.flagged ? (
                  <>
                    <span aria-hidden>★</span>
                    Flagged for later
                  </>
                ) : (
                  <>
                    <span className="text-slate-400" aria-hidden>☆</span>
                    Flag for later review
                  </>
                )}
              </button>
            </div>
          )}
          {notification.replyText && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Your reply</p>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{notification.replyText}</p>
              {notification.repliedAt && (
                <p className="text-xs text-slate-400 mt-1">{new Date(notification.repliedAt).toLocaleString()}</p>
              )}
            </div>
          )}
          {showReplySection && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <label htmlFor="notification-dialog-reply" className="text-xs font-medium text-slate-600 block">
                Reply
              </label>
              <textarea
                id="notification-dialog-reply"
                value={replyDraft}
                onChange={(e) => onReplyDraftChange?.(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
              />
              <button
                type="button"
                onClick={() => canSubmitReply && onReply?.(replyDraft.trim())}
                disabled={!canSubmitReply}
                className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReplySubmitting ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
