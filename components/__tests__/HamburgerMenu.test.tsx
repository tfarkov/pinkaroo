import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import HamburgerMenu from '../HamburgerMenu';

test('opens menu', () => {
  render(
    <SessionProvider session={null}>
      <HamburgerMenu />
    </SessionProvider>
  );
  fireEvent.click(screen.getByLabelText('Menu'));
  expect(screen.getByText('Home')).toBeInTheDocument();
});
