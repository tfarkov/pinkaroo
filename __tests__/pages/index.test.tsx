import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Home from '../../pages/index';
import { AllProviders } from '../../lib/__tests__/test-utils';

const mockUseRouter = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
    pathname: '/',
    asPath: '/',
  });
});

test('renders home with hero and map section', () => {
  render(
    <AllProviders>
      <Home />
    </AllProviders>
  );
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  expect(screen.getByText(/Nearby Listings/i)).toBeInTheDocument();
});

test('shows recently viewed section when localStorage has ids', () => {
  localStorage.setItem('recentlyViewed', JSON.stringify(['1', '2']));
  render(
    <AllProviders>
      <Home />
    </AllProviders>
  );
  expect(screen.getByText(/Recently Viewed/i)).toBeInTheDocument();
  expect(screen.getAllByText(/View Listing/i).length).toBeGreaterThanOrEqual(1);
});

test('shows empty recently viewed state when no ids in storage', () => {
  localStorage.removeItem('recentlyViewed');
  render(
    <AllProviders>
      <Home />
    </AllProviders>
  );
  expect(screen.getByText(/No recently viewed listings yet/i)).toBeInTheDocument();
});

test('shows and dismisses signed-out message when query contains signedOut=1', () => {
  const replace = jest.fn();
  mockUseRouter.mockReturnValue({
    push: jest.fn(),
    replace,
    query: { signedOut: '1' },
    pathname: '/',
    asPath: '/',
  });

  render(
    <AllProviders>
      <Home />
    </AllProviders>
  );

  expect(screen.getByText(/You have been signed out successfully/i)).toBeInTheDocument();
  expect(replace).toHaveBeenCalledWith('/', undefined, { shallow: true });

  fireEvent.click(screen.getByRole('button', { name: /dismiss signed out message/i }));
  expect(screen.queryByText(/You have been signed out successfully/i)).not.toBeInTheDocument();
});
