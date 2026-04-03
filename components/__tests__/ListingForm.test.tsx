import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListingForm from '../ListingForm';
import { AllProviders } from '../../lib/__tests__/test-utils';
import axios from 'axios';
import { geocodeAddressClient } from '../../lib/geocodeClient';
import { MAP_NO_KEY_MESSAGE } from '../../lib/constants';

jest.mock('react-ga');
jest.mock('lodash', () => ({ debounce: (fn: (...args: unknown[]) => unknown) => fn }));
jest.mock('axios');
jest.mock('../../lib/geocodeClient', () => ({ geocodeAddressClient: jest.fn() }));

const mockPush = jest.fn();
const mockUseUnitToggle = jest.fn(() => ({ isMetric: true }));
const mockUseAuth = jest.fn(() => ({ user: { id: 'u1', role: 'REALTOR' } }));

jest.mock('next/router', () => ({ useRouter: () => ({ push: mockPush, query: {}, pathname: '/listings/new', asPath: '/listings/new' }) }));
jest.mock('../../lib/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
jest.mock('../../lib/hooks/useUnitToggle', () => ({ useUnitToggle: () => mockUseUnitToggle() }));

jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoogleMap: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Marker: () => <div data-testid="map-marker" />,
}));

function withProviders(ui: React.ReactElement) {
  return <AllProviders>{ui}</AllProviders>;
}

describe('ListingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
    (axios.post as jest.Mock).mockResolvedValue({ data: { id: 'listing-1' } });
    (geocodeAddressClient as jest.Mock).mockResolvedValue({ lat: 44.4, lng: -79.7 });
    mockUseUnitToggle.mockReturnValue({ isMetric: true });
  });

  test('submits successfully and redirects to listing page', async () => {
    const { container } = render(withProviders(<ListingForm />));
    fireEvent.change(screen.getByPlaceholderText('e.g. Cozy 3BR'), { target: { value: 'Test Home' } });
    fireEvent.change(container.querySelector('textarea[name="description"]')!, { target: { value: 'Great listing' } });
    fireEvent.change(container.querySelector('input[name="price"]')!, { target: { value: '500000' } });
    fireEvent.change(container.querySelector('input[name="location"]')!, { target: { value: 'Barrie, ON' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/listings', expect.any(FormData), expect.objectContaining({ withCredentials: true }));
      expect(mockPush).toHaveBeenCalledWith('/listings/listing-1');
    });
  });

  test('shows map fallback message when maps key is missing', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    render(withProviders(<ListingForm />));
    expect(screen.getByText(MAP_NO_KEY_MESSAGE)).toBeInTheDocument();
  });

  test('shows mutation error message when save fails', async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error('Save failed'));
    const { container } = render(withProviders(<ListingForm />));
    fireEvent.change(screen.getByPlaceholderText('e.g. Cozy 3BR'), { target: { value: 'Test Home' } });
    fireEvent.change(container.querySelector('textarea[name="description"]')!, { target: { value: 'Great listing' } });
    fireEvent.change(container.querySelector('input[name="price"]')!, { target: { value: '500000' } });
    fireEvent.change(container.querySelector('input[name="location"]')!, { target: { value: 'Barrie, ON' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/save failed/i)).toBeInTheDocument();
  });

  test('converts imperial size input to sqm before submit', async () => {
    mockUseUnitToggle.mockReturnValue({ isMetric: false });
    const { container } = render(withProviders(<ListingForm />));
    fireEvent.change(screen.getByPlaceholderText('e.g. Cozy 3BR'), { target: { value: 'Test Home' } });
    fireEvent.change(container.querySelector('textarea[name="description"]')!, { target: { value: 'Great listing' } });
    fireEvent.change(container.querySelector('input[name="price"]')!, { target: { value: '500000' } });
    fireEvent.change(container.querySelector('input[name="location"]')!, { target: { value: 'Barrie, ON' } });
    const sizeImperialInput = Array.from(container.querySelectorAll('input[type="number"]'))
      .find((input) => (input as HTMLInputElement).name !== 'price');
    fireEvent.change(sizeImperialInput!, { target: { value: '1076' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    const payload = (axios.post as jest.Mock).mock.calls[0][1] as FormData;
    expect(Number(payload.get('sizeSqm'))).toBeGreaterThan(90);
    expect(Number(payload.get('sizeSqm'))).toBeLessThan(110);
  });

  test('handles file upload input', () => {
    const { container } = render(withProviders(<ListingForm />));
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    const file = new File([''], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
  });
});
