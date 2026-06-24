import { createContext, useContext, useState, useCallback } from 'react';

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
  }, []);

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
