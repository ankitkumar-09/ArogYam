import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';
const DoctorContext = createContext(null);

export const DoctorProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false); // don't auto-fetch on app load
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  //i guess firstly we have to fetech the token from the local storage is not token we will go for login in login we will set the token in local stroage th eagin profile will fetech for the doctor data
  const fetchProfile = useCallback(async (token) => {
    if (!token) {
      setDoctor(null);
      setIsAuthenticated(false);
      return;
    }
    setLoading(true);
    //if token found...
    try {
      const res = await axios.get(`${API_URL}/doctors/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      // axios responses don't have `ok`; check data.success
      if (data && data.success) {
        setDoctor(data.data);
        setIsAuthenticated(true);
        setToken(token);
        localStorage.setItem('role', 'doctor');
      } else {
        setDoctor(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setToken(null);
      }
    } catch (err) {
      console.error('Fetch doctor profile error:', err?.response?.data || err.message);
      setDoctor(null);
      setIsAuthenticated(false);
      setError(err);
      // clear token on error
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const login = async (token, doctorData) => {
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('role', 'doctor');
    if (doctorData) {
      setDoctor(doctorData);
      setIsAuthenticated(true);
      return;
    }
    await fetchProfile(token);
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await axios.post(`${API_URL}/doctors/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout error:', err?.response?.data || err.message);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setDoctor(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    fetchProfile(token);
  }, [fetchProfile, token]);

  return (
    <DoctorContext.Provider value={{ doctor, loading, isAuthenticated, error, token, login, logout, fetchProfile }}>
      {children}
    </DoctorContext.Provider>
  );
};

// safe hook: returns context or safe defaults so Navbar can be used without provider
export const useDoctor = () => {
  const ctx = useContext(DoctorContext);
  if (ctx) return ctx;
  return {
    doctor: null,
    loading: false,
    isAuthenticated: false,
    error: null,
    token: null,
    login: () => {},
    logout: () => {},
    fetchProfile: () => {}
  };
};

export const useDoctorAuth = () => useContext(DoctorContext);

export default DoctorContext;
