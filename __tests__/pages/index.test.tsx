import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../../pages/index';
import { AllProviders } from '../../lib/__tests__/test-utils';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: {}, pathname: '/', asPath: '/' }),
}));

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
