import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: true, isRealtor: true, isBroker: false, isAdmin: false })),
}));
jest.mock('../../lib/hooks/useUnitToggle', () => ({
  useUnitToggle: jest.fn(() => ({ isMetric: true, toggleUnit: jest.fn() })),
}));
test('renders header with toggle', () => {
  render(<Header />);
  expect(screen.getByAltText('Pinkaroo Logo')).toBeInTheDocument();
  expect(screen.getByText('Unit: Metric')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Unit: Metric'));
  // Assert toggle called
});
test('renders navigation links', () => {
  render(<Header />);
  expect(screen.getByText('Listings')).toBeInTheDocument();
  expect(screen.getByText('Add Listing')).toBeInTheDocument();
  expect(screen.getByText('Logout')).toBeInTheDocument();
});
