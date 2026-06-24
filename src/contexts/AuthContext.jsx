import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

function sessionToUser(supabaseUser) {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    firstName: supabaseUser.user_metadata?.first_name || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [pendingRegionCarryover, setPendingRegionCarryover] = useState(null);

  useEffect(() => {
    // Restore existing session immediately so ProtectedRoute doesn't flash a redirect.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(sessionToUser(session.user));
      setAuthInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(sessionToUser(session.user));
      } else {
        setUser(null);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const stored = localStorage.getItem('pc_local_region');
        if (stored) {
          authService.fetchUserProfile(session.user.id).then(profile => {
            if (!profile?.local_city) {
              const parts = stored.split(',').map(p => p.trim());
              if (parts.length >= 2) {
                setPendingRegionCarryover({ city: parts[0], state: parts[1] });
              }
            }
          }).catch(() => {});
        }
      }

      if (event === 'SIGNED_OUT') {
        setPendingRegionCarryover(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (credentials) => {
    return authService.login(credentials);
    // onAuthStateChange (SIGNED_IN) updates user state.
  }, []);

  const register = useCallback(async (data) => {
    return authService.register(data);
    // Email confirmation required — no session created yet.
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    // onAuthStateChange (SIGNED_OUT) clears user state.
  }, []);

  const updateProfile = useCallback(async (data) => {
    const result = await authService.updateProfile({ user, ...data });
    // onAuthStateChange (USER_UPDATED) refreshes user state for metadata changes.
    return result;
  }, [user]);

  const updatePassword = useCallback(async (data) => {
    return authService.updatePassword({ user, ...data });
  }, [user]);

  const saveRegionToProfile = useCallback(async () => {
    if (!pendingRegionCarryover || !user) return;
    const { city, state } = pendingRegionCarryover;
    try {
      await authService.saveLocalRegionToProfile(user.id, city, state);
    } catch { /* non-fatal */ }
    setPendingRegionCarryover(null);
  }, [pendingRegionCarryover, user]);

  const dismissRegionCarryover = useCallback(() => {
    setPendingRegionCarryover(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      authInitialized,
      pendingRegionCarryover,
      login,
      register,
      logout,
      updateProfile,
      updatePassword,
      saveRegionToProfile,
      dismissRegionCarryover,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
