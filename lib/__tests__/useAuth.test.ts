import { renderHook } from '@testing-library/react-hooks';
import { useAuth } from '../hooks/useAuth';
import { SessionProvider } from 'next-auth/react';

test('returns authenticated state', () => {
  const wrapper = ({ children }) => <SessionProvider session={{ user: { role: 'ADMIN' } }}>{children}</SessionProvider>;
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.isAdmin).toBe(true);
});
