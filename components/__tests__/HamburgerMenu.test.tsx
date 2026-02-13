import { render, screen, fireEvent } from '@testing-library/react';
import HamburgerMenu from '../HamburgerMenu';

test('opens menu', () => {
  render(<HamburgerMenu />);
  fireEvent.click(screen.getByText('☰'));
  expect(screen.getByText('Home')).toBeInTheDocument();
});
