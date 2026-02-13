import { renderHook, act } from '@testing-library/react-hooks';
import { useNotifications } from '../hooks/useNotifications';
jest.mock('socket.io-client', () => ({
  default: jest.fn(() => ({ on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() })),
}));
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ user: { id: '1' } })),
}));

test('receives notification', () => {
  const { result } = renderHook(() => useNotifications());
  act(() => {
    // Simulate socket event
    result.current.notifications = [{ id: '1', message: 'Test', read: false }];
  });
  expect(result.current.unreadCount).toBe(1);
  act(() => result.current.markAsRead('1'));
  expect(result.current.unreadCount).toBe(0);
});
