import { render, screen, fireEvent } from '@testing-library/react';
import AdvancedFilters from '../AdvancedFilters';
import { useRouter } from 'next/router';
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), query: {} })),
}));

test('applies filters', () => {
  const onFilter = jest.fn();
  render(<AdvancedFilters onFilter={onFilter} />);
  fireEvent.change(screen.getByRole('combobox', { name: /Province/i }), { target: { value: 'ONTARIO' } });
  fireEvent.submit(screen.getByRole('form'));
  expect(onFilter).toHaveBeenCalled();
});
