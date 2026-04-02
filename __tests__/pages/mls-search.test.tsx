import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MLSSearch from '../../pages/mls-search';
import { AllProviders } from '../../lib/__tests__/test-utils';
import { useAuth } from '../../lib/hooks/useAuth';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: {}, pathname: '/mls-search', asPath: '/mls-search' }),
}));

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    role: 'REALTOR',
    isSystemAdmin: false,
    isOfficeAdmin: false,
    isAdmin: false,
    isRealtor: true,
    isBroker: false,
    isTeamLead: false,
    canManageBrokersRealtors: false,
    canManageSystemSettings: false,
    canEditRealtorProfiles: false,
    user: undefined,
    status: 'authenticated',
  });
});

test('renders MLS search form', () => {
  render(<AllProviders><MLSSearch /></AllProviders>);
  expect(screen.getByText(/Search Canadian MLS Listings/i)).toBeInTheDocument();
});

test('handles submit', () => {
  const { container } = render(<AllProviders><MLSSearch /></AllProviders>);
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. Barrie/i), { target: { value: 'Barrie' } });
  const form = container.querySelector('form');
  expect(form).toBeTruthy();
  fireEvent.submit(form!);
});

test('shows restricted access message for general users', () => {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    role: 'USER',
    isSystemAdmin: false,
    isOfficeAdmin: false,
    isAdmin: false,
    isRealtor: false,
    isBroker: false,
    isTeamLead: false,
    canManageBrokersRealtors: false,
    canManageSystemSettings: false,
    canEditRealtorProfiles: false,
    user: undefined,
    status: 'authenticated',
  });
  render(<AllProviders><MLSSearch /></AllProviders>);
  expect(screen.getByText(/MLS Search is role-restricted/i)).toBeInTheDocument();
});
