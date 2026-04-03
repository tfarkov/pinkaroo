import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '../Footer';
import { AllProviders } from '../../lib/__tests__/test-utils';

const mockToggleUnit = jest.fn();

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    isRealtor: true,
    isBroker: false,
    isSystemAdmin: false,
    isOfficeAdmin: false,
  })),
}));

jest.mock('../../lib/hooks/useUnitToggle', () => ({
  useUnitToggle: jest.fn(() => ({ isMetric: true, toggleUnit: mockToggleUnit })),
}));

function renderFooter() {
  return render(
    <AllProviders>
      <Footer />
    </AllProviders>
  );
}

test('renders footer links and unit toggle', () => {
  renderFooter();
  expect(screen.getByText('Pinkaroo')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /use imperial units/i })).toBeInTheDocument();
});

test('toggles units from footer control', () => {
  renderFooter();
  fireEvent.click(screen.getByRole('button', { name: /use imperial units/i }));
  expect(mockToggleUnit).toHaveBeenCalled();
});
