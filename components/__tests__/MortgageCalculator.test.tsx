import { render, screen, fireEvent } from '@testing-library/react';
import MortgageCalculator from '../MortgageCalculator';

test('calculates payment', () => {
  render(<MortgageCalculator price={100000} />);
  fireEvent.change(screen.getByRole('slider', { name: /Down Payment/i }), { target: { value: '10' } });
  expect(screen.getByText(/Monthly Payment/i)).toBeInTheDocument();
});
