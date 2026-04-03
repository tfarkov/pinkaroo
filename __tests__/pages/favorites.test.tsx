import React from 'react';
import { render, screen } from '@testing-library/react';
import FavoritesPage from '../../pages/favorites';

const mockUseFavorites = jest.fn();

jest.mock('../../lib/hooks/useFavorites', () => ({
  useFavorites: () => mockUseFavorites(),
}));

jest.mock('../../components/Header', () => () => <div data-testid="header" />);
jest.mock('../../components/Footer', () => () => <div data-testid="footer" />);
jest.mock('../../components/ui/BottomNav', () => () => <div data-testid="bottom-nav" />);

jest.mock('../../components/ListingCard', () => ({
  __esModule: true,
  default: ({ listing }: { listing: { id: string; title?: string } }) => (
    <div data-testid="listing-card">{listing.title ?? listing.id}</div>
  ),
}));

jest.mock('idb', () => ({
  openDB: jest.fn(async () => ({
    transaction: () => ({
      store: { put: jest.fn() },
      done: Promise.resolve(),
    }),
  })),
}));

test('renders favorites with shared listing card', () => {
  mockUseFavorites.mockReturnValue({
    favorites: [
      { id: 'fav-1', listing: { id: 'listing-1', title: 'Sample Property' } },
      { id: 'fav-2', listing: { id: 'listing-2', title: 'Lake View Condo' } },
    ],
    toggleFavorite: jest.fn(),
    isFavorited: () => true,
    isLoading: false,
  });

  render(<FavoritesPage />);

  expect(screen.getByRole('heading', { name: /my favourites/i })).toBeInTheDocument();
  expect(screen.getAllByTestId('listing-card')).toHaveLength(2);
  expect(screen.getByText('Sample Property')).toBeInTheDocument();
});

test('shows empty state when no favourites', () => {
  mockUseFavorites.mockReturnValue({
    favorites: [],
    toggleFavorite: jest.fn(),
    isFavorited: () => false,
    isLoading: false,
  });

  render(<FavoritesPage />);

  expect(screen.getByText(/no favourites yet/i)).toBeInTheDocument();
});

test('shows loading state and hides empty state while favourites load', () => {
  mockUseFavorites.mockReturnValue({
    favorites: [],
    toggleFavorite: jest.fn(),
    isFavorited: () => false,
    isLoading: true,
  });

  render(<FavoritesPage />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(screen.queryByText(/no favourites yet/i)).not.toBeInTheDocument();
});

test('shows empty state when favorites are present but not renderable', () => {
  mockUseFavorites.mockReturnValue({
    favorites: [{ id: 'fav-1', listing: undefined }],
    toggleFavorite: jest.fn(),
    isFavorited: () => false,
    isLoading: false,
  });

  render(<FavoritesPage />);

  expect(screen.getByText(/no favourites yet/i)).toBeInTheDocument();
});
