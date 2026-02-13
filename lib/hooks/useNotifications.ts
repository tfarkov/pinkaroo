import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API, CONTENT_TYPE } from '../constants';
import { getMockNotifications } from '../mockData';

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await fetch(API.NOTIFICATIONS);
        if (res.ok) return res.json();
        return getMockNotifications();
      } catch {
        return getMockNotifications();
      }
    },
  });
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(API.NOTIFICATIONS, {
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAsRead = (id: string) => markAsReadMutation.mutate(id);

  return { notifications, unreadCount, markAsRead };
}
