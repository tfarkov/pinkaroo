import { render, screen, fireEvent } from '@testing-library/react';
import MortgageCalculator from '../MortgageCalculator';

test('calculates payment', () => {
  render(<MortgageCalculator price={100000} />);
  const sliders = screen.getAllByRole('slider');
  expect(sliders.length).toBeGreaterThanOrEqual(1);
  fireEvent.change(sliders[0], { target: { value: '10' } });
  expect(screen.getByText(/Monthly Payment/i)).toBeInTheDocument();
});
