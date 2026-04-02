import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationsDropdown from '../NotificationsDropdown';
import { AllProviders } from '../../lib/__tests__/test-utils';

const mockUseNotifications = jest.fn();

jest.mock('../../lib/hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications(),
}));

beforeEach(() => {
  mockUseNotifications.mockReturnValue({
    notifications: [{ id: '1', message: 'Test', read: false, createdAt: new Date().toISOString() }],
    unreadCount: 1,
    markAsRead: jest.fn(),
    reply: jest.fn(),
    setFlagged: jest.fn(),
    updateMutation: { isPending: false, isError: false },
  });
});

test('renders dropdown and shows notification on click', () => {
  render(
    <AllProviders>
      <NotificationsDropdown />
    </AllProviders>
  );
  fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
  expect(screen.getByText('Test')).toBeInTheDocument();
});

test('shows empty state when there are no notifications', () => {
  mockUseNotifications.mockReturnValue({
    notifications: [],
    unreadCount: 0,
    markAsRead: jest.fn(),
    reply: jest.fn(),
    setFlagged: jest.fn(),
    updateMutation: { isPending: false, isError: false },
  });
  render(
    <AllProviders>
      <NotificationsDropdown />
    </AllProviders>
  );
  fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
  expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
});

test('shows update error hint when mutation fails', () => {
  mockUseNotifications.mockReturnValue({
    notifications: [{ id: '1', message: 'Test', read: false, createdAt: 'bad-date' }],
    unreadCount: 1,
    markAsRead: jest.fn(),
    reply: jest.fn(),
    setFlagged: jest.fn(),
    updateMutation: { isPending: false, isError: true },
  });
  render(
    <AllProviders>
      <NotificationsDropdown />
    </AllProviders>
  );
  fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
  expect(screen.getByText(/Unable to update notification/i)).toBeInTheDocument();
  expect(screen.getByText(/Unknown time/i)).toBeInTheDocument();
});
