import { useState, useEffect } from 'react';
import { DEFAULT_LOCATION } from '../constants';

export function useGeolocation() {
   const [position, setPosition] = useState(DEFAULT_LOCATION);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          setError(err.message);
          setPosition(DEFAULT_LOCATION); // Fallback
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation not supported');
    }
  }, []);
  return position;
}
