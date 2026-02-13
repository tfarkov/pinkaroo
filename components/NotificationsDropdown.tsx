import React, { useState } from 'react';
import { useNotifications } from '../lib/hooks/useNotifications';
import { UI } from '../lib/constants';

export default function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-accent-500 rounded-full" />}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-card-hover border border-primary-100 py-2 max-h-80 overflow-y-auto z-50">
          <div className="px-3 py-2 border-b border-primary-100 font-medium text-primary-900 text-sm">{UI.NOTIFICATIONS}</div>
          {notifications.map((notif) => (
            <button key={notif.id} type="button" onClick={() => markAsRead(notif.id)} className="w-full text-left px-3 py-2.5 hover:bg-primary-50 text-sm text-primary-700 border-b border-primary-50 last:border-0">
              {notif.message}
              <span className="block text-xs text-primary-500 mt-0.5">{new Date(notif.createdAt).toLocaleString()}</span>
            </button>
          ))}
          {notifications.length === 0 && <p className="px-3 py-4 text-primary-500 text-sm">{UI.NO_NOTIFICATIONS}</p>}
        </div>
      )}
    </div>
  );
}
