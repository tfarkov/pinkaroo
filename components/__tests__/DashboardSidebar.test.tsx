import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardSidebar from '../DashboardSidebar';
import { AllProviders } from '../../lib/__tests__/test-utils';

const mockUseRouter = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderSidebar() {
  return render(
    <AllProviders>
      <DashboardSidebar />
    </AllProviders>
  );
}

describe('DashboardSidebar role navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ pathname: '/dashboard' });
  });

  it('shows user section links for USER role', () => {
    mockUseAuth.mockReturnValue({
      role: 'USER',
      isRealtor: false,
      isBroker: false,
      isAdmin: false,
      isOfficeAdmin: false,
      isSystemAdmin: false,
    });

    renderSidebar();

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Favourites')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.queryByText('Broker')).not.toBeInTheDocument();
  });

  it('shows realtor dashboards link for BROKER role', () => {
    mockUseAuth.mockReturnValue({
      role: 'BROKER',
      isRealtor: false,
      isBroker: true,
      isAdmin: false,
      isOfficeAdmin: false,
      isSystemAdmin: false,
    });

    renderSidebar();

    expect(screen.getByText('Broker')).toBeInTheDocument();
    expect(screen.getByText('Realtor dashboards')).toBeInTheDocument();
    expect(screen.getByText('Team management')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Workload')).toBeInTheDocument();
    expect(screen.getByText('Client oversight')).toBeInTheDocument();
    expect(screen.getByText('Communications')).toBeInTheDocument();
    expect(screen.getByText('Admin controls')).toBeInTheDocument();
  });

  it('shows office admin links for OFFICE_ADMIN role', () => {
    mockUseAuth.mockReturnValue({
      role: 'OFFICE_ADMIN',
      isRealtor: false,
      isBroker: false,
      isAdmin: false,
      isOfficeAdmin: true,
      isSystemAdmin: false,
    });

    renderSidebar();

    expect(screen.getByText('Office Admin')).toBeInTheDocument();
    expect(screen.getByText('Office Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Broker/Realtor Management')).toBeInTheDocument();
  });

  it('shows system admin links for SYSTEM_ADMIN role', () => {
    mockUseAuth.mockReturnValue({
      role: 'SYSTEM_ADMIN',
      isRealtor: false,
      isBroker: false,
      isAdmin: true,
      isOfficeAdmin: false,
      isSystemAdmin: true,
    });

    renderSidebar();

    expect(screen.getByText('System Admin')).toBeInTheDocument();
    expect(screen.getByText('System Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Admin Operations')).toBeInTheDocument();
  });
});
