import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { usePatientContext } from '../../contexts/PatientContext';
import AppointmentCard from '../../patientComponent/AppointmentCard';
import AppointmentDeatilsModel from '../../patientComponent/AppointmentDeatilsModel';
import PatientNavbar from '../../patientComponent/PatientNavbar';

const BookedAppointment = () => {
  const { API_URL, patient, token } = usePatientContext();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | cancelled | all

  const authHeaders = useMemo(() => {
    const tkn = token || localStorage.getItem('token');
    return tkn ? { Authorization: `Bearer ${tkn}` } : {};
  }, [token]);

  const fetchAppointments = useCallback(async () => {
    const patientId = patient?._id;
    if (!patientId) return;

    setLoading(true);
    setErr('');
    try {
      const res = await axios.get(`${API_URL}/appointments/patient/${encodeURIComponent(patientId)}`, { headers: authHeaders });
      const data = res?.data;
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

      // "recent basis" default sort by scheduledAt desc
      const sorted = [...list].sort((a, b) => new Date(b?.scheduledAt || 0) - new Date(a?.scheduledAt || 0));
      setAppointments(sorted);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Something went wrong');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, authHeaders, patient?._id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const isCancelled = (a) => (a?.status || '').toLowerCase() === 'cancelled';
    const isBooked = (a) => (a?.status || '').toLowerCase() === 'booked';
    const when = (a) => new Date(a?.scheduledAt || 0).getTime();

    const base = appointments;

    if (filter === 'cancelled') return base.filter(isCancelled);
    if (filter === 'all') return base;

    if (filter === 'upcoming') {
      // only booked upcoming; sort soonest first for usability
      return base
        .filter((a) => isBooked(a) && when(a) >= now)
        .sort((a, b) => when(a) - when(b));
    }

    if (filter === 'past') {
      // past includes completed + booked-in-past (if any)
      return base
        .filter((a) => !isCancelled(a) && when(a) < now)
        .sort((a, b) => when(b) - when(a));
    }

    return base;
  }, [appointments, filter]);

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'all', label: 'All' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />

      {/* Layout: no left padding on mobile; add top padding for sticky header; keep sidebar offset on lg */}
      <main className="pt-16 lg:pt-6 lg:pl-64 px-4 sm:px-6 lg:px-8">
        {/* Center + consistent vertical rhythm */}
        <div className="mx-auto max-w-7xl py-6 sm:py-8 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Appointments</h1>
              <p className="mt-1 text-sm text-gray-600">Browse recent appointments. Use filters and open details per appointment.</p>
            </div>

            {!selected && (
              <button
                onClick={fetchAppointments}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          {/* Tabs */}
          {!selected && (
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => {
                const active = filter === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-medium border transition",
                      active ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {err}
            </div>
          )}

          <div>
            {loading && !selected && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Loading appointments...
              </div>
            )}

            {/* Details view (same page): hide grid when selected */}
            {selected && (
              <AppointmentDeatilsModel
                open={true}
                appointment={selected}
                onClose={() => setSelected(null)}
                onUpdated={() => {
                  setSelected(null);
                  fetchAppointments();
                }}
                onCancelled={() => {
                  setSelected(null);
                  fetchAppointments();
                }}
              />
            )}

            {!selected && !loading && filtered.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="text-gray-900 font-medium">No appointments found</div>
                <div className="mt-1 text-sm text-gray-600">Try switching filters or book a new appointment.</div>
              </div>
            )}

            {!selected && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((appt) => (
                  <AppointmentCard
                    key={appt?._id || `${appt?.date}-${appt?.startTime}`}
                    appointment={appt}
                    onView={() => setSelected(appt)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookedAppointment;