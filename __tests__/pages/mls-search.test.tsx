import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MLSSearch from '../../pages/mls-search';
import { AllProviders } from '../../lib/__tests__/test-utils';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: {}, pathname: '/mls-search', asPath: '/mls-search' }),
}));

test('renders MLS search form', () => {
  render(<AllProviders><MLSSearch /></AllProviders>);
  expect(screen.getByText(/Search Canadian MLS Listings/i)).toBeInTheDocument();
});

test('handles submit', () => {
  const { container } = render(<AllProviders><MLSSearch /></AllProviders>);
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. Barrie/i), { target: { value: 'Barrie' } });
  const form = container.querySelector('form');
  expect(form).toBeTruthy();
  fireEvent.submit(form!);
});
