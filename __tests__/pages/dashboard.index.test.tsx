import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardPage from '../../pages/dashboard/index';

const mockUseAuth = jest.fn();
const mockUseFavorites = jest.fn();
const mockUseNotifications = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../lib/hooks/useFavorites', () => ({
  useFavorites: () => mockUseFavorites(),
}));

jest.mock('../../lib/hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: (args: unknown) => mockUseQuery(args),
}));

jest.mock('../../components/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div>Bar chart</div>,
  Line: () => <div>Line chart</div>,
}));

jest.mock('chart.js/auto', () => ({}));

function renderDashboard() {
  return render(<DashboardPage />);
}

describe('Dashboard role-based rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFavorites.mockReturnValue({
      favorites: [{ id: 'fav-1', listing: { id: 'l2', title: 'Favourite Listing' } }],
      isFavorited: jest.fn(() => true),
      toggleFavorite: jest.fn(),
    });
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 'n1',
          message: 'Update from your realtor',
          createdAt: new Date().toISOString(),
          fromUser: { role: 'REALTOR', name: 'Rita', email: 'rita@example.com' },
        },
      ],
    });
    mockUseQuery.mockImplementation((args: any) => {
      const key = Array.isArray(args?.queryKey) ? args.queryKey[0] : args?.queryKey;
      if (key === 'my-listings-dashboard') {
        return {
          data: {
            listings: [{ id: 'l1', title: 'My Listing', status: 'ACTIVE', price: 500000 }],
          },
        };
      }
      if (key === 'clients') {
        return { data: [{ id: 'c1', name: 'Client One', status: 'NEW', email: 'c1@example.com' }] };
      }
      if (key === 'interactions') {
        return { data: { interactions: [{ id: 'i1', date: new Date().toISOString() }] } };
      }
      if (key === 'broker-stats') {
        return { data: { teamCount: 2, availableRealtors: [{ id: 'r1' }], pending: 3 } };
      }
      if (key === 'dashboard-user') {
        return { data: { availableHours: 'Mon–Fri 9am–5pm' } };
      }
      return { data: undefined };
    });
  });

  it('renders USER dashboard widgets and hides CRM section', () => {
    mockUseAuth.mockReturnValue({
      role: 'USER',
      user: { id: 'user-1' },
    });

    renderDashboard();

    expect(screen.getByText('USER Dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('My listings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('My favourites').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Communications with realtors')).toBeInTheDocument();
    expect(screen.queryByText('CRM – Client management')).not.toBeInTheDocument();
  });

  it('renders REALTOR charts and CRM/communications sections', () => {
    mockUseAuth.mockReturnValue({
      role: 'REALTOR',
      user: { id: 'realtor-1' },
    });

    renderDashboard();

    expect(screen.getByText('REALTOR Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Client status distribution')).toBeInTheDocument();
    expect(screen.getByText('User interactions over time')).toBeInTheDocument();
    expect(screen.getByText('CRM – Client management')).toBeInTheDocument();
    expect(screen.getByText('Notifications & communications')).toBeInTheDocument();
  });

  it('renders realtor availability editor and submits updates', () => {
    mockUseAuth.mockReturnValue({
      role: 'REALTOR',
      user: { id: 'realtor-1' },
    });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    (global as { fetch?: typeof fetch }).fetch = fetchMock as typeof fetch;

    renderDashboard();

    const input = screen.getByDisplayValue('Mon–Fri 9am–5pm');
    fireEvent.change(input, { target: { value: 'Mon–Thu 10am–4pm' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/users/realtor-1', expect.objectContaining({
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({ availableHours: 'Mon–Thu 10am–4pm' }),
    }));
  });

  it('renders BROKER summary cards and realtor dashboard links', () => {
    mockUseAuth.mockReturnValue({
      role: 'BROKER',
      user: { id: 'broker-1' },
    });

    renderDashboard();

    expect(screen.getByText('BROKER Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Teams managed')).toBeInTheDocument();
    expect(screen.getByText('Available realtors')).toBeInTheDocument();
    expect(screen.getByText('Pending approvals')).toBeInTheDocument();
    expect(screen.getByText('CRM – Client management')).toBeInTheDocument();
    expect(screen.getByText('Notifications & communications')).toBeInTheDocument();
    expect(screen.getByText('Broker dashboard')).toBeInTheDocument();
    expect(screen.getByText('Realtor dashboards')).toBeInTheDocument();
  });

  it('renders safe fallback text for invalid notification timestamps', () => {
    mockUseAuth.mockReturnValue({
      role: 'USER',
      user: { id: 'user-1' },
    });
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 'n1',
          message: 'Malformed date message',
          createdAt: 'invalid-date',
          fromUser: { role: 'REALTOR', name: 'Rita', email: 'rita@example.com' },
        },
      ],
    });
    renderDashboard();
    expect(screen.getByText(/Unknown time/i)).toBeInTheDocument();
  });
});
