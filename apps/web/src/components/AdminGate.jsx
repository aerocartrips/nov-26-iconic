import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminGate = ({ children }) => {
  const { isAdminAuthed, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdminAuthed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default AdminGate;
