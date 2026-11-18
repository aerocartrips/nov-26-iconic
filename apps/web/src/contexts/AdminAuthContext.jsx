import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearAdminSession,
  readAdminSession,
  verifyAdminLogin,
  writeAdminSession,
} from '@/lib/adminAuth';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(readAdminSession());
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    await verifyAdminLogin(email, password);
    const next = { email: email.trim().toLowerCase(), password };
    writeAdminSession(next.email, next.password);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setSession(null);
  }, []);

  const value = {
    session,
    isAdminAuthed: !!session,
    loading,
    login,
    logout,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
