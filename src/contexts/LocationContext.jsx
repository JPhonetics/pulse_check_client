import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as authService from '../services/authService';

const STORAGE_KEY = 'pc_local_region';

function loadFromStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [localRegion, setLocalRegionState] = useState(loadFromStorage);

  const setLocalRegion = useCallback((region) => {
    try {
      if (region) {
        localStorage.setItem(STORAGE_KEY, region);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // storage unavailable
    }
    setLocalRegionState(region);

    if (user && region) {
      const parts = region.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        authService.saveLocalRegionToProfile(user.id, parts[0], parts[1]).catch(() => {});
      }
    }
  }, [user]);

  return (
    <LocationContext.Provider value={{ localRegion, setLocalRegion }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
