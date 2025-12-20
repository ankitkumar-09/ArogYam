import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctorAuth } from '../contexts/DoctorContext';

const DoctorProtectedWrapper = ({ children }) => {
  const { doctor, loading, token, fetchProfile } = useDoctorAuth();
  const location = useLocation();

  useEffect(() => {
    if (!doctor && token && !loading) {
      fetchProfile(token);
    }
  }, [doctor, token, loading, fetchProfile]);

  if (loading) return null; // or spinner

  // If we have a token but doctor not yet loaded, wait (avoid redirect loop immediately after login)
  if (!doctor && token) return null;

  if (!doctor && !token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default DoctorProtectedWrapper;