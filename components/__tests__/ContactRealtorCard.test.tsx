import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactRealtorCard from '../ContactRealtorCard';

const mockUseAuth = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

describe('ContactRealtorCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ asPath: '/dashboard' });
  });

  it('shows sign-in CTA when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <ContactRealtorCard
        realtor={{ id: 'r1', name: 'Alex Realtor', email: 'alex@example.com' }}
      />
    );
    expect(screen.getByRole('link', { name: /contact alex/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact alex/i })).toHaveAttribute(
      'href',
      '/signin?callbackUrl=%2Fdashboard'
    );
  });

  it('sends in-app message and shows sent state when authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown;

    render(
      <ContactRealtorCard
        realtor={{ id: 'r1', name: 'Alex Realtor', email: 'alex@example.com' }}
      />
    );

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hi there' } });
    fireEvent.click(screen.getByRole('button', { name: /message alex/i }));

    await waitFor(() => {
      expect((global as { fetch: jest.Mock }).fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ toUserId: 'r1', message: 'Hi there' }),
        })
      );
    });
    expect(screen.getByRole('button', { name: /sent/i })).toBeInTheDocument();
  });

  it('shows validation error when authenticated message is empty', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (global as { fetch?: unknown }).fetch = jest.fn() as unknown;

    render(
      <ContactRealtorCard
        realtor={{ id: 'r1', name: 'Alex Realtor', email: 'alex@example.com' }}
      />
    );

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /message alex/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/message is required/i);
    expect((global as { fetch: jest.Mock }).fetch).not.toHaveBeenCalled();
  });
});
