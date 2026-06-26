import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

function persistToStorage(region) {
  try {
    if (region) {
      localStorage.setItem(STORAGE_KEY, region);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // storage unavailable
  }
}

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [localRegion, setLocalRegionState] = useState(loadFromStorage);
  const prevUserIdRef = useRef(user?.id ?? null);

  // On login: load location from DB profile. On logout: clear stored region.
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const currId = user?.id ?? null;
    prevUserIdRef.current = currId;

    if (currId && currId !== prevId) {
      // User just logged in — fetch their saved location from the DB.
      authService.fetchUserProfile(currId).then(profile => {
        if (profile?.local_city && profile?.local_state) {
          const region = `${profile.local_city}, ${profile.local_state}`;
          persistToStorage(region);
          setLocalRegionState(region);
        }
      }).catch(() => {});
    } else if (!currId && prevId) {
      // User just logged out — clear the stored region.
      persistToStorage(null);
      setLocalRegionState(null);
    }
  }, [user]);

  const setLocalRegion = useCallback((region) => {
    persistToStorage(region);
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
