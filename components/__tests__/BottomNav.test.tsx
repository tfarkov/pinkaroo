import React from 'react';
import { render, screen } from '@testing-library/react';
import BottomNav from '../ui/BottomNav';
import { AllProviders } from '../../lib/__tests__/test-utils';

const mockUseRouter = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderBottomNav() {
  return render(
    <AllProviders>
      <BottomNav />
    </AllProviders>
  );
}

describe('BottomNav auth links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ pathname: '/' });
  });

  it('hides dashboard link for anonymous users', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    renderBottomNav();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows dashboard link for authenticated users', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    renderBottomNav();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
