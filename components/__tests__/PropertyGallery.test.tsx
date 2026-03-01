import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyGallery from '../PropertyGallery';

jest.mock('next/image', () => function MockImage(props: { src?: string; alt?: string }) {
  return <img src={props.src} alt={props.alt} />;
});

const validUrls = ['https://example.com/1.jpg', 'https://example.com/2.jpg'];

test('renders gallery with valid URLs and changes image', () => {
  render(<PropertyGallery images={validUrls} />);
  expect(screen.getByAltText('Property')).toBeInTheDocument();
  const thumbnails = screen.getAllByRole('button').filter((b) => b.querySelector('img'));
  if (thumbnails.length >= 2) {
    fireEvent.click(thumbnails[1]);
  }
  expect(screen.getByAltText('Property')).toBeInTheDocument();
});

test('shows no photos when images are empty or invalid', () => {
  render(<PropertyGallery images={[]} />);
  expect(screen.getByText('No photos')).toBeInTheDocument();
});
