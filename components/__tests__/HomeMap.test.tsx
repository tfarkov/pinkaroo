import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HomeMap, { getMarkerPosition } from '../HomeMap';

const mockPush = jest.fn();
const mockSetZoom = jest.fn();
const mockGetZoom = jest.fn(() => 10);
const mockAddListener = jest.fn((_event: string, cb: () => void) => cb());

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children, onError }: { children: React.ReactNode; onError?: () => void }) => (
    <div data-testid="load-script">
      {children}
      <button type="button" onClick={() => onError?.()} aria-label="trigger-map-error">
        trigger-map-error
      </button>
    </div>
  ),
  GoogleMap: ({ children, onLoad }: { children: React.ReactNode; onLoad?: (map: unknown) => void }) => {
    onLoad?.({
      getCenter: () => ({ lat: () => 44.38, lng: () => -79.69 }),
      getZoom: mockGetZoom,
      setZoom: mockSetZoom,
      addListener: mockAddListener,
    });
    return <div data-testid="google-map">{children}</div>;
  },
  Marker: ({ title, onClick }: { title?: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {title ?? 'marker'}
    </button>
  ),
}));

describe('getMarkerPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key';
  });

  it('returns null for missing or invalid coords', () => {
    expect(getMarkerPosition({ id: '1', latitude: null, longitude: null })).toBeNull();
    expect(getMarkerPosition({ id: '1', latitude: 44, longitude: undefined })).toBeNull();
    expect(getMarkerPosition({ id: '1', latitude: 0, longitude: 0 })).toBeNull();
    expect(getMarkerPosition({ id: '1', latitude: 244, longitude: -279 })).toBeNull();
  });

  it('returns coords when already valid', () => {
    expect(getMarkerPosition({ id: '1', latitude: 44.3894, longitude: -79.6903 })).toEqual({
      lat: 44.3894,
      lng: -79.6903,
    });
  });

  it('swaps reversed latitude/longitude when clearly reversed', () => {
    expect(getMarkerPosition({ id: '1', latitude: -79.6903, longitude: 44.3894 })).toEqual({
      lat: 44.3894,
      lng: -79.6903,
    });
  });
});

describe('HomeMap component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key';
  });

  it('shows no-key message when map key is missing', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    render(<HomeMap position={{ lat: 44.38, lng: -79.69 }} listings={[]} />);
    expect(screen.getByText(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/i)).toBeInTheDocument();
  });

  it('renders markers and navigates to listing on marker click', () => {
    render(
      <HomeMap
        position={{ lat: 44.38, lng: -79.69 }}
        listings={[{ id: 'listing-1', latitude: 44.38, longitude: -79.69, title: 'Listing One' }]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Listing One' }));
    expect(mockPush).toHaveBeenCalledWith('/listings/listing-1');
  });

  it('zoom controls call map setZoom', () => {
    render(
      <HomeMap
        position={{ lat: 44.38, lng: -79.69 }}
        listings={[{ id: 'listing-1', latitude: 44.38, longitude: -79.69 }]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /zoom in map/i }));
    fireEvent.click(screen.getByRole('button', { name: /zoom out map/i }));
    expect(mockSetZoom).toHaveBeenCalledWith(11);
    expect(mockSetZoom).toHaveBeenCalledWith(9);
  });

  it('falls back to default static map view when load error occurs', () => {
    render(<HomeMap position={{ lat: 44.38, lng: -79.69 }} listings={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'trigger-map-error' }));
    expect(screen.getByAltText(/map of nearby listings/i)).toBeInTheDocument();
  });
});
