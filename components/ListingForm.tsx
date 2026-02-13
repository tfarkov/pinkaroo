import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/hooks/useAuth';
import axios from 'axios';
import { API, CONTENT_TYPE, DEFAULT_LOCATION, GA, PROVINCES, PROPERTY_TYPES, UI, DEBOUNCE_MS } from '../lib/constants';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import ReactGA from 'react-ga';
import { debounce } from 'lodash';

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
  images: FileList;
}

export default function ListingForm({ listing }: { listing?: any }) {
  const { register, handleSubmit } = useForm<FormData>({ defaultValues: listing });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  const [error, setError] = useState(null);
  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images') {
          Array.from(value as FileList).forEach((file: File) => formData.append('images', file));
        } else {
          formData.append(key, value as string);
        }
      });
      return axios.post(API.LISTINGS, formData, { headers: { 'Content-Type': CONTENT_TYPE.MULTIPART_FORM_DATA } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      ReactGA.event({ category: GA.LISTING, action: GA.LISTING_CREATED });
    },
    onError: (err: Error) => setError(err.message),
  });

  const debouncedGeocode = debounce(async (location: string) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`;
      const response = await axios.get(url);
      if (response.data.results?.[0]) {
        const { lat, lng } = response.data.results[0].geometry.location;
        setPosition({ lat, lng });
        ReactGA.event({ category: GA.GEOCODING, action: GA.GEOCODING_SUCCESS });
      } else {
        setPosition(DEFAULT_LOCATION);
      }
    } catch (err) {
      setError((err as Error).message);
      ReactGA.event({ category: GA.GEOCODING, action: GA.GEOCODING_FAILURE });
    }
  }, DEBOUNCE_MS);

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-primary-900 mb-4">Add listing</h2>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">{UI.TITLE}</label>
          <input {...register('title')} className="input-field" placeholder="e.g. Cozy 3BR" required />
        </div>
        <div>
          <label className="label">{UI.DESCRIPTION}</label>
          <textarea {...register('description')} className="input-field min-h-[100px]" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{UI.PRICE}</label>
            <input {...register('price')} type="number" className="input-field" required />
          </div>
          <div>
            <label className="label">{UI.LOCATION}</label>
            <input {...register('location')} className="input-field" onChange={(e) => debouncedGeocode(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Province</label>
            <select {...register('province')} className="input-field" required>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{UI.POSTAL_CODE}</label>
            <input {...register('postalCode')} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">{UI.SIZE_SQM}</label>
            <input {...register('sizeSqm')} type="number" className="input-field" />
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
          <select {...register('propertyType')} className="input-field" required>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Photos</label>
          <input type="file" multiple accept="image/*" {...register('images')} className="input-field py-2" />
        </div>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
            <div className="rounded-xl overflow-hidden border border-primary-200">
              <GoogleMap center={position} zoom={10} mapContainerStyle={{ height: '200px' }}>
                <Marker position={position} />
              </GoogleMap>
            </div>
          </LoadScript>
        ) : (
          <div className="rounded-xl border border-primary-200 h-[200px] bg-primary-100 flex items-center justify-center text-primary-500 text-sm">Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)</div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="btn-primary">{UI.SUBMIT}</button>
      </form>
    </div>
  );
}
