import { render, screen, fireEvent } from '@testing-library/react';
import AdvancedFilters from '../AdvancedFilters';

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), query: {} })),
}));

test('applies filters when province changes (debounced)', async () => {
  const onFilter = jest.fn();
  render(<AdvancedFilters onFilter={onFilter} />);
  fireEvent.change(screen.getByLabelText(/Any Province/i), { target: { value: 'ONTARIO' } });
  await new Promise((r) => setTimeout(r, 400));
  expect(onFilter).toHaveBeenCalled();
});

test('does not render apply filters button when auto-apply is enabled', () => {
  const onFilter = jest.fn();
  render(<AdvancedFilters onFilter={onFilter} />);
  expect(screen.queryByRole('button', { name: /apply filters/i })).not.toBeInTheDocument();
});
