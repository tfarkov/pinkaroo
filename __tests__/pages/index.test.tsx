import { render, screen } from '@testing-library/react';
import Home from '../../pages/index';
test('renders home with map', () => {
  render(<Home />);
  expect(screen.getByText(/Welcome to Pinkaroo Real Estate Portal/i)).toBeInTheDocument();
});
test('shows recently viewed', () => {
  localStorage.setItem('recentlyViewed', JSON.stringify(['1', '2']));
  render(<Home />);
  expect(screen.getByText(/View Listing 1/i)).toBeInTheDocument();
});
