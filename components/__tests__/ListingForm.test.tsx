import { render, screen, fireEvent } from '@testing-library/react';
import ListingForm from '../ListingForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
jest.mock('react-ga');
const queryClient = new QueryClient();
test('renders form and submits', async () => {
  render(<QueryClientProvider client={queryClient}><ListingForm /></QueryClientProvider>);
  expect(screen.getByPlaceholderText(/Title/i)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/Title/i), { target: { value: 'Test' } });
  fireEvent.submit(screen.getByRole('button', { name: /Submit/i }));
  // Assert mutation called, GA event.
});
test('handles file upload', () => {
  // Test file input
  const file = new File([''], 'test.png', { type: 'image/png' });
  fireEvent.change(screen.getByType('file'), { target: { files: [file] } });
});
