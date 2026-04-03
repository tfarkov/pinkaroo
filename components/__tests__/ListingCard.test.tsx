import React from 'react';
import { render, screen } from '@testing-library/react';
import ListingCard from '../ListingCard';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ListingCard', () => {
  it('renders default variant with beds, baths, area, and location', () => {
    render(
      <ListingCard
        listing={{
          id: 'listing-1',
          title: 'Downtown Condo',
          price: 725000,
          bedroomsTotal: 2,
          bathroomsTotal: 2,
          sizeSqm: 95,
          location: 'Toronto, ON',
          images: ['https://example.com/condo.jpg'],
        }}
      />
    );

    expect(screen.getByText('$725,000')).toBeInTheDocument();
    expect(screen.getByText('Downtown Condo')).toBeInTheDocument();
    expect(screen.getByText(/2 bed · 2 bath/i)).toBeInTheDocument();
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument();
  });

  it('renders mini variant with custom meta line', () => {
    render(
      <ListingCard
        variant="mini"
        listing={{
          id: 'listing-2',
          title: 'Family Home',
          price: 899000,
          images: ['https://example.com/home.jpg'],
        }}
        metaLine="APPROVED · $899,000"
      />
    );

    expect(screen.getByText('Family Home')).toBeInTheDocument();
    expect(screen.getByText('APPROVED · $899,000')).toBeInTheDocument();
    expect(screen.getByText(/view listing/i)).toBeInTheDocument();
  });
});
