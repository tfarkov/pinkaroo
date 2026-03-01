import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { AllProviders } from '../../lib/__tests__/test-utils';

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: true, isRealtor: true, isBroker: false, isAdmin: false })),
}));
jest.mock('../../lib/hooks/useUnitToggle', () => ({
  useUnitToggle: jest.fn(() => ({ isMetric: true, toggleUnit: jest.fn() })),
}));

function renderHeader() {
  return render(
    <AllProviders>
      <Header />
    </AllProviders>
  );
}

test('renders header with toggle', () => {
  renderHeader();
  expect(screen.getByAltText('Pinkaroo')).toBeInTheDocument();
  expect(screen.getByText('Metric')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Metric'));
});

test('renders navigation links', () => {
  renderHeader();
  expect(screen.getByText('Find a Home')).toBeInTheDocument();
  expect(screen.getByText('Add Listing')).toBeInTheDocument();
  expect(screen.getByText('Sign out')).toBeInTheDocument();
});
