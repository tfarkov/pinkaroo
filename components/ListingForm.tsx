import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/hooks/useAuth';
import axios from 'axios';
import { API, DEFAULT_LOCATION, GA, PROVINCES, PROPERTY_TYPES, UI, DEBOUNCE_MS, SQFT_CONVERSION_FACTOR, getListingPageUrl, MAP_NO_KEY_MESSAGE } from '../lib/constants';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import { geocodeAddressClient } from '../lib/geocodeClient';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import ReactGA from 'react-ga';
import { debounce } from 'lodash';
import { computeEcoRatingScore, getEcoRatingDisplay, HEATING_TYPES, INSULATION_OPTIONS } from '../lib/ecoRating';

interface FormData {
  title: string;
  description: string;
  price: number;
  location: string;
  province: string;
  postalCode: string;
  sizeSqm: number;
  bedroomsTotal: number;
  bathroomsTotal: number;
  propertyType: string;
  images: FileList | undefined;
  latitude?: number;
  longitude?: number;
  streetAddress?: string;
  yearBuilt?: number;
  lotSizeSqm?: number;
  heatingType?: string;
  insulationQuality?: string;
  hasRecentRenovations?: boolean;
  roofAgeYears?: number;
  appliancesAgeYears?: number;
}

const defaultNewListing: Partial<FormData> = {
  province: 'ONTARIO',
  postalCode: '',
  sizeSqm: 0,
  bedroomsTotal: 0,
  bathroomsTotal: 0,
  propertyType: 'House',
  latitude: DEFAULT_LOCATION.lat,
  longitude: DEFAULT_LOCATION.lng,
};

export default function ListingForm({ listing }: { listing?: any }) {
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: listing ?? defaultNewListing,
    mode: 'onBlur',
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isMetric } = useUnitToggle();
  const [position, setPosition] = useState(() =>
    listing?.latitude != null && listing?.longitude != null
      ? { lat: Number(listing.latitude), lng: Number(listing.longitude) }
      : { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng }
  );
  const [error, setError] = useState<string | null>(null);
  const [mapLoadError, setMapLoadError] = useState(false);
  useEffect(() => {
    if (listing?.latitude != null && listing?.longitude != null) {
      setPosition({ lat: Number(listing.latitude), lng: Number(listing.longitude) });
    } else if (!listing) {
      setPosition({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
    }
  }, [listing?.latitude, listing?.longitude, listing]);
  const sizeSqm = watch('sizeSqm');
  const lotSizeSqm = watch('lotSizeSqm');
  const yearBuilt = watch('yearBuilt');
  const heatingType = watch('heatingType');
  const insulationQuality = watch('insulationQuality');
  const hasRecentRenovations = watch('hasRecentRenovations');
  const roofAgeYears = watch('roofAgeYears');
  const appliancesAgeYears = watch('appliancesAgeYears');
  const ecoPreviewScore = useMemo(() => computeEcoRatingScore({
    yearBuilt: yearBuilt != null && !Number.isNaN(Number(yearBuilt)) ? Number(yearBuilt) : null,
    heatingType: heatingType || null,
    insulationQuality: insulationQuality || null,
    hasRecentRenovations: !!hasRecentRenovations,
    roofAgeYears: roofAgeYears != null && !Number.isNaN(Number(roofAgeYears)) ? Number(roofAgeYears) : null,
    appliancesAgeYears: appliancesAgeYears != null && !Number.isNaN(Number(appliancesAgeYears)) ? Number(appliancesAgeYears) : null,
  }), [yearBuilt, heatingType, insulationQuality, hasRecentRenovations, roofAgeYears, appliancesAgeYears]);
  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData = new FormData();
      let sizeToStore = data.sizeSqm;
      if (!isMetric && sizeToStore != null) {
        sizeToStore = Number(sizeToStore) / SQFT_CONVERSION_FACTOR;
      }
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'images') {
          if (value && (value as FileList).length) {
            Array.from(value as FileList).forEach((file: File) => formData.append('images', file));
          }
        } else if (key === 'sizeSqm') {
          formData.append(key, String(sizeToStore ?? value));
        } else if (key === 'lotSizeSqm') {
          if (value != null && !Number.isNaN(Number(value))) formData.append(key, String(value));
        } else if (key === 'latitude' || key === 'longitude') {
          if (typeof value === 'number' && !Number.isNaN(value)) formData.append(key, String(value));
        } else if (key === 'hasRecentRenovations') {
          formData.append(key, value === true ? 'true' : 'false');
        } else if (key === 'roofAgeYears' || key === 'appliancesAgeYears') {
          if (value != null && !Number.isNaN(Number(value))) formData.append(key, String(value));
        } else {
          formData.append(key, String(value));
        }
      });
      return axios.post(API.LISTINGS, formData, { withCredentials: true });
    },
    onSuccess: (response: { data: { id: string } }) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      ReactGA.event({ category: GA.LISTING, action: GA.LISTING_CREATED });
      if (!listing && response?.data?.id) {
        const url = getListingPageUrl(response.data.id);
        if (url) router.push(url);
      }
    },
    onError: (err: Error) => setError(err?.message ?? 'Failed to save listing'),
  });

  const debouncedGeocode = debounce(async (location: string) => {
    if (!location?.trim()) return;
    try {
      const result = await geocodeAddressClient(location);
      if (result) {
        setPosition({ lat: result.lat, lng: result.lng });
        setValue('latitude', result.lat);
        setValue('longitude', result.lng);
        setError(null);
        ReactGA.event({ category: GA.GEOCODING, action: GA.GEOCODING_SUCCESS });
      } else {
        setPosition(DEFAULT_LOCATION);
        setValue('latitude', DEFAULT_LOCATION.lat);
        setValue('longitude', DEFAULT_LOCATION.lng);
        ReactGA.event({ category: GA.GEOCODING, action: GA.GEOCODING_FAILURE });
      }
    } catch (err) {
      setError((err as Error).message);
      ReactGA.event({ category: GA.GEOCODING, action: GA.GEOCODING_FAILURE });
    }
  }, DEBOUNCE_MS);

  return (
    <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Add listing</h2>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">{UI.TITLE}</label>
          <input {...register('title', { required: 'Title is required' })} className="input-field" placeholder="e.g. Cozy 3BR" aria-invalid={!!errors.title} />
          {errors.title && <p className="text-red-600 text-sm mt-1" role="alert">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label">{UI.DESCRIPTION}</label>
          <textarea {...register('description', { required: 'Description is required' })} className="input-field min-h-[100px]" aria-invalid={!!errors.description} />
          {errors.description && <p className="text-red-600 text-sm mt-1" role="alert">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{UI.PRICE}</label>
            <input {...register('price', { required: 'Price is required', min: { value: 1, message: 'Price must be greater than 0' }, valueAsNumber: true })} type="number" className="input-field" aria-invalid={!!errors.price} />
            {errors.price && <p className="text-red-600 text-sm mt-1" role="alert">{errors.price.message}</p>}
          </div>
          <div>
            <label className="label">{UI.LOCATION}</label>
            <input {...register('location', { required: 'Location is required' })} className="input-field" onChange={(e) => debouncedGeocode(e.target.value)} aria-invalid={!!errors.location} />
            {errors.location && <p className="text-red-600 text-sm mt-1" role="alert">{errors.location.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Province</label>
            <select {...register('province', { required: 'Province is required' })} className="input-field" aria-invalid={!!errors.province}>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.province && <p className="text-red-600 text-sm mt-1" role="alert">{errors.province.message}</p>}
          </div>
          <div>
            <label className="label">{UI.POSTAL_CODE}</label>
            <input {...register('postalCode')} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">{isMetric ? 'Size (m²)' : 'Size (sq ft)'}</label>
            {isMetric ? (
              <input {...register('sizeSqm')} type="number" className="input-field" />
            ) : (
              <input
                type="number"
                className="input-field"
                value={sizeSqm != null ? Math.round((Number(sizeSqm) || 0) * SQFT_CONVERSION_FACTOR) : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') setValue('sizeSqm', 0);
                  else setValue('sizeSqm', parseFloat(v) / SQFT_CONVERSION_FACTOR);
                }}
              />
            )}
          </div>
          <div>
            <label className="label">{UI.BEDROOMS}</label>
            <input {...register('bedroomsTotal')} type="number" className="input-field" />
          </div>
          <div>
            <label className="label">{UI.BATHROOMS}</label>
            <input {...register('bathroomsTotal')} type="number" className="input-field" />
          </div>
        </div>
        <div>
          <label className="label">Property type</label>
          <select {...register('propertyType', { required: 'Property type is required' })} className="input-field" aria-invalid={!!errors.propertyType}>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.propertyType && <p className="text-red-600 text-sm mt-1" role="alert">{errors.propertyType.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Street address</label>
            <input {...register('streetAddress')} className="input-field" placeholder="e.g. 123 Main St" />
          </div>
          <div>
            <label className="label">Year built</label>
            <input {...register('yearBuilt', { setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)) })} type="number" min={1800} max={new Date().getFullYear() + 1} className="input-field" placeholder="e.g. 1995" />
          </div>
          <div>
            <label className="label">{isMetric ? 'Lot size (m²)' : 'Lot size (sq ft)'}</label>
            {isMetric ? (
              <input {...register('lotSizeSqm', { setValueAs: (v) => (v === '' ? undefined : parseFloat(v)) })} type="number" className="input-field" placeholder="e.g. 500" />
            ) : (
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 5000"
                value={lotSizeSqm != null && lotSizeSqm > 0 ? Math.round(Number(lotSizeSqm) * SQFT_CONVERSION_FACTOR) : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') setValue('lotSizeSqm', undefined as any);
                  else setValue('lotSizeSqm', parseFloat(v) / SQFT_CONVERSION_FACTOR);
                }}
              />
            )}
          </div>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Eco rating (sustainability)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Heating type</label>
              <select {...register('heatingType')} className="input-field">
                {HEATING_TYPES.map((o) => (
                  <option key={o.value || 'none'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Insulation quality</label>
              <select {...register('insulationQuality')} className="input-field">
                {INSULATION_OPTIONS.map((o) => (
                  <option key={o.value || 'none'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Roof age (years)</label>
              <input {...register('roofAgeYears', { setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)) })} type="number" min={0} className="input-field" placeholder="e.g. 8" />
            </div>
            <div>
              <label className="label">Appliances age (years)</label>
              <input {...register('appliancesAgeYears', { setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)) })} type="number" min={0} className="input-field" placeholder="e.g. 3" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('hasRecentRenovations')} className="rounded border-slate-300" />
              <span className="text-sm text-slate-700">Recent renovations (last 5–10 years)</span>
            </label>
          </div>
          {ecoPreviewScore != null && ecoPreviewScore >= 7 && (
            <p className="mt-3 text-sm text-slate-600">
              Eco rating preview: <span className="font-semibold text-green-700">{getEcoRatingDisplay(ecoPreviewScore)}</span>
            </p>
          )}
        </div>
        <div>
          <label className="label">Photos</label>
          <input type="file" multiple accept="image/*" {...register('images')} className="input-field py-2" />
        </div>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            onError={() => setMapLoadError(true)}
            loadingElement={
              <div className="h-[200px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-500 text-sm">
                Loading map…
              </div>
            }
          >
            {!mapLoadError ? (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <GoogleMap
                  center={position}
                  zoom={10}
                  mapContainerStyle={{ height: '200px' }}
                  options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}
                >
                  <Marker position={position} />
                </GoogleMap>
              </div>
            ) : (
              <div className="h-[200px] bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 text-sm">
                Map could not be loaded.
              </div>
            )}
          </LoadScript>
        ) : (
          <div className="rounded-lg border border-slate-200 h-[200px] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
            {MAP_NO_KEY_MESSAGE}
          </div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="btn-primary">{UI.SUBMIT}</button>
      </form>
    </div>
  );
}
