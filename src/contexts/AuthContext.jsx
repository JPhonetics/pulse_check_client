import { createContext, useContext, useState, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = guest

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data) => {
    const result = await authService.register(data);
    return result;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const result = await authService.updateProfile({ user, ...data });
    if (result.ok) setUser(result.user);
    return result;
  }, [user]);

  const updatePassword = useCallback(async (data) => {
    return authService.updatePassword({ user, ...data });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
