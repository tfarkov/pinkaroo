import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API, CONTENT_TYPE } from '../constants';
import { getMockNotifications } from '../mockData';

export interface NotificationFromUser {
  id: string;
  name: string | null;
  email: string;
  role?: string;
}

export interface Notification {
  id: string;
  message: string;
  type?: string;
  read: boolean;
  replyText?: string | null;
  repliedAt?: string | null;
  flagged?: boolean;
  createdAt: string;
  fromUserId?: string | null;
  fromUser?: NotificationFromUser | null;
}

const fetchOptions: RequestInit = { credentials: 'include' };

export function useNotifications() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await fetch(API.NOTIFICATIONS, fetchOptions);
        if (res.ok) return res.json();
        return getMockNotifications();
      } catch {
        return getMockNotifications();
      }
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; read?: boolean; replyText?: string; flagged?: boolean }) =>
      fetch(API.NOTIFICATIONS, {
        ...fetchOptions,
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAsRead = (id: string) => updateMutation.mutate({ id, read: true });
  const reply = (id: string, replyText: string) => updateMutation.mutate({ id, replyText });
  const setFlagged = (id: string, flagged: boolean) => updateMutation.mutate({ id, flagged });

  return { notifications, unreadCount, markAsRead, reply, setFlagged, updateMutation };
}
