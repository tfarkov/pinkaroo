import { render, screen, fireEvent } from '@testing-library/react';
import MLSSearch from '../../pages/mls-search';
test('renders MLS search form', () => {
  render(<MLSSearch />);
  expect(screen.getByText(/Search Canadian MLS Listings/i)).toBeInTheDocument();
});
test('handles submit', () => {
  render(<MLSSearch />);
  fireEvent.change(screen.getByPlaceholderText(/City/i), { target: { value: 'Barrie' } });
  fireEvent.submit(screen.getByRole('form'));
});
