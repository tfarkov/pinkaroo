import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationsDropdown from '../NotificationsDropdown';
import { AllProviders } from '../../lib/__tests__/test-utils';

jest.mock('../../lib/hooks/useNotifications', () => ({
  useNotifications: jest.fn(() => ({
    notifications: [{ id: '1', message: 'Test', read: false, createdAt: new Date().toISOString() }],
    unreadCount: 1,
    markAsRead: jest.fn(),
    reply: jest.fn(),
    setFlagged: jest.fn(),
    updateMutation: { isPending: false },
  })),
}));

test('renders dropdown and shows notification on click', () => {
  render(
    <AllProviders>
      <NotificationsDropdown />
    </AllProviders>
  );
  fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
  expect(screen.getByText('Test')).toBeInTheDocument();
});
