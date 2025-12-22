import React, { createContext, useContext, useState, useCallback } from 'react';

const PatientContext = createContext(null);

export const PatientProvider = ({ children }) => {
  const API_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';
  const [patient, setPatient] = useState(null);
  // start as not loading so home page doesn't trigger spinner / fetch on load
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const fetchProfile = useCallback(async (tkn) => {
    if (!tkn) {
      setPatient(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/patients/profile`, {
        headers: { Authorization: `Bearer ${tkn}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatient(data.data);
        localStorage.setItem('role', 'patient');
      } else {
        setPatient(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setToken(null);
      }
    } catch (err) {
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const login = async (tkn, patientData) => {
    setToken(tkn);
    localStorage.setItem('token', tkn);
    localStorage.setItem('role', 'patient');
    if (patientData) {
      setPatient(patientData);
      return;
    }
    // lazy fetch profile when login is called without patient data
    await fetchProfile(tkn);
  };

  const logout = async () => {
    const tkn = localStorage.getItem('token');
    try {
      if (tkn) {
        await fetch(`${API_URL}/patients/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tkn}` }
        });
      }
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setPatient(null);
  };

  return (
    <PatientContext.Provider
      value={{
        API_URL, // NEW
        patient,
        loading,
        token,
        login,
        logout,
        fetchProfile
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatientAuth = () => useContext(PatientContext);

// add this alias so existing components can import `usePatientContext`
export const usePatientContext = usePatientAuth;

export default PatientContext;