import { render, screen, fireEvent } from '@testing-library/react';
import PropertyGallery from '../PropertyGallery';

test('renders gallery and changes image', () => {
  render(<PropertyGallery images={['img1', 'img2']} />);
  expect(screen.getByAltText('Property image')).toHaveAttribute('src', 'img1');
  fireEvent.click(screen.getByAltText('Thumbnail')[1]);
  expect(screen.getByAltText('Property image')).toHaveAttribute('src', 'img2');
});
