import { render, screen, fireEvent } from '@testing-library/react';
import NotificationsDropdown from '../NotificationsDropdown';
jest.mock('../lib/hooks/useNotifications', () => ({
  useNotifications: jest.fn(() => ({ notifications: [{ id: '1', message: 'Test', read: false }], unreadCount: 1, markAsRead: jest.fn() })),
}));

test('renders dropdown', () => {
  render(<NotificationsDropdown />);
  fireEvent.click(screen.getByText('Notifications (1)'));
  expect(screen.getByText('Test')).toBeInTheDocument();
});
