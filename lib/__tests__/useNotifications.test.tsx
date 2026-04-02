import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '../hooks/useNotifications';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ status: 'authenticated' })),
}));

jest.mock('socket.io-client', () => ({
  default: jest.fn(() => ({ on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() })),
}));

global.fetch = jest.fn(() => Promise.resolve({ ok: false })) as any;

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

test('returns notifications and unreadCount', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
  const { result } = renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => {
    expect(Array.isArray(result.current.notifications)).toBe(true);
  });
  expect(typeof result.current.unreadCount).toBe('number');
  expect(typeof result.current.markAsRead).toBe('function');
});
