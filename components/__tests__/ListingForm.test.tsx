import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ListingForm from '../ListingForm';
import { AllProviders } from '../../lib/__tests__/test-utils';

jest.mock('react-ga');
jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: {}, pathname: '/listings/new', asPath: '/listings/new' }),
}));

function withProviders(ui: React.ReactElement) {
  return <AllProviders>{ui}</AllProviders>;
}

test('renders form and submits', async () => {
  render(withProviders(<ListingForm />));
  const titleInput = screen.getByPlaceholderText('e.g. Cozy 3BR');
  expect(titleInput).toBeInTheDocument();
  fireEvent.change(titleInput, { target: { value: 'Test' } });
  fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
});

test('handles file upload', () => {
  const { container } = render(withProviders(<ListingForm />));
  const fileInput = container.querySelector('input[type="file"]');
  expect(fileInput).toBeTruthy();
  const file = new File([''], 'test.png', { type: 'image/png' });
  fireEvent.change(fileInput!, { target: { files: [file] } });
});
