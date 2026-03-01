import React from 'react';
import { renderHook } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { useAuth } from '../hooks/useAuth';

test('returns authenticated state', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider session={{ user: { role: 'ADMIN' } } as any}>{children}</SessionProvider>
  );
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.isAdmin).toBe(true);
});
