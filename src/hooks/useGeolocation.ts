import { useState, useEffect } from 'react';
import { Location } from '../types';
import { isMockMode } from '../utils/mockMode';

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
  permissionGranted: boolean;
}

// Default mock location (London) - used when in mock mode
const MOCK_LOCATION: Location = {
  lat: 51.5074,
  lng: -0.1278,
};

export const useGeolocation = (watch: boolean = true) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
    permissionGranted: false,
  });

  useEffect(() => {
    // In mock mode, return a predefined location instead of using browser geolocation
    if (isMockMode()) {
      setState({
        location: MOCK_LOCATION,
        error: null,
        loading: false,
        permissionGranted: true,
      });
      return;
    }

    if (!navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionGranted: false,
      });
      return;
    }

    let watchId: number | null = null;

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        error: null,
        loading: false,
        permissionGranted: true,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unable to retrieve your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get user location timed out.';
          break;
      }

      setState({
        location: null,
        error: errorMessage,
        loading: false,
        permissionGranted: false,
      });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    if (watch) {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch]);

  return state;
};
