import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from '../../pages/profile';

const mockUseAuth = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: jest.fn(), asPath: '/profile' }),
}));

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: (args: unknown) => mockUseQuery(args),
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div>Header</div>,
}));

jest.mock('../../components/Footer', () => ({
  __esModule: true,
  default: () => <div>Footer</div>,
}));

jest.mock('../../components/ui/BottomNav', () => ({
  __esModule: true,
  default: () => <div>BottomNav</div>,
}));

describe('Profile page availability editor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'realtor-1', name: 'Rita', role: 'REALTOR' },
      isAuthenticated: true,
      status: 'authenticated',
      isRealtor: true,
    });
    mockUseQuery.mockImplementation((args: any) => {
      const key = Array.isArray(args?.queryKey) ? args.queryKey[0] : args?.queryKey;
      if (key === 'profile-user') {
        return { data: { availableHours: 'Mon–Fri 9am–5pm' } };
      }
      return { data: undefined };
    });
  });

  it('prefills available hours for realtors', async () => {
    render(<ProfilePage />);
    expect(await screen.findByDisplayValue('Mon–Fri 9am–5pm')).toBeInTheDocument();
  });

  it('submits updated available hours', () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    (global as { fetch?: typeof fetch }).fetch = fetchMock as typeof fetch;

    render(<ProfilePage />);

    const input = screen.getByDisplayValue('Mon–Fri 9am–5pm');
    fireEvent.change(input, { target: { value: 'Tue–Sat 10am–6pm' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/users/realtor-1', expect.objectContaining({
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({ availableHours: 'Tue–Sat 10am–6pm' }),
    }));
  });
});
