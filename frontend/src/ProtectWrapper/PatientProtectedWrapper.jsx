import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePatientAuth } from '../contexts/PatientContext';

const PatientProtectedWrapper = ({ children }) => {
  const { patient, loading, token, fetchProfile } = usePatientAuth();
  const location = useLocation();

  useEffect(() => {
    if (!patient && token && !loading) {
      // lazy fetch when entering a protected route and token exists
      fetchProfile(token);
    }
  }, [patient, token, loading, fetchProfile]);

  if (loading) return null; // or a small spinner

  // If we have a token but patient not yet loaded, wait (avoid redirect loop immediately after login)
  if (!patient && token) return null;

  if (!patient && !token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default PatientProtectedWrapper;