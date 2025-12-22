import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { usePatientContext } from '../contexts/PatientContext';

const AppointmentDeatilsModel = ({ open, appointment, onClose, onCancelled, onUpdated }) => {
  const { API_URL, token, patient } = usePatientContext();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // NEW: cancel popup state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // NEW: reschedule popup state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => appointment?.date || '');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsErr, setSlotsErr] = useState('');
  const [slots, setSlots] = useState([]); // [{time,type,fee}]
  const [selectedTime, setSelectedTime] = useState('');

  const doneCb = onUpdated || onCancelled;

  const authHeaders = useMemo(() => {
    const tkn = token || localStorage.getItem('token');
    return tkn ? { Authorization: `Bearer ${tkn}` } : {};
  }, [token]);

  const apptStatus = (appointment?.status || '').toLowerCase();
  const canCancel = apptStatus === 'booked';
  const isCancelled = apptStatus === 'cancelled';

  const doctor = appointment?.doctor && typeof appointment.doctor === 'object' ? appointment.doctor : null;

  const doctorMeta = useMemo(() => {
    const name = doctor?.name || 'Doctor';
    const specialization = doctor?.specialization || '—';
    const qualifications = Array.isArray(doctor?.qualifications) ? doctor.qualifications : [];
    const verified = !!doctor?.isVerified;
    const online = !!doctor?.isOnline;
    const rating = typeof doctor?.rating === 'number' ? doctor.rating : (doctor?.rating ? Number(doctor.rating) : null);
    const totalReviews = doctor?.totalReviews ?? null;
    const profileImage = doctor?.profileImage || '';
    return { name, specialization, qualifications, verified, online, rating, totalReviews, profileImage };
  }, [doctor]);

  const scheduledText = useMemo(() => {
    if (appointment?.scheduledAt) {
      const dt = new Date(appointment.scheduledAt);
      if (!Number.isNaN(dt.getTime())) return dt.toLocaleString();
    }
    return '—';
  }, [appointment?.scheduledAt]);

  // CHANGED: accept reason param (no window.prompt)
  const cancelAppointment = async (reason) => {
    if (!appointment?._id) return;

    const patientId = patient?._id;
    if (!patientId) {
      setErr('Missing patient id');
      return;
    }

    setBusy(true);
    setErr('');
    try {
      await axios.post(
        `${API_URL}/appointments/${appointment._id}/cancel`,
        { patientId: patient?._id, reason: String(reason || '') },
        { headers: { 'Content-Type': 'application/json', ...authHeaders } }
      );
      doneCb?.();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to cancel appointment');
    } finally {
      setBusy(false);
    }
  };

  // NEW: fetch free slots for reschedule date
  const fetchFreeSlots = async (dateStr) => {
    const doctorId =
      (appointment?.doctor && typeof appointment.doctor === 'object' ? appointment.doctor?._id : appointment?.doctor) || '';

    if (!doctorId || !dateStr) return;

    setSlotsLoading(true);
    setSlotsErr('');
    setSlots([]);
    setSelectedTime('');
    try {
      const res = await axios.get(`${API_URL}/appointments/availability`, {
        params: { doctorId, date: dateStr, type: appointment?.type || 'video' },
        headers: authHeaders
      });
      const list = res?.data?.data?.slots || [];
      setSlots(Array.isArray(list) ? list : []);
    } catch (e) {
      setSlotsErr(e?.response?.data?.message || e?.message || 'Failed to load free slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  // NEW: confirm reschedule
  const rescheduleAppointment = async () => {
    if (!appointment?._id) return;
    if (!patient?._id) {
      setErr('Missing patient id');
      return;
    }
    if (!rescheduleDate || !selectedTime) {
      setSlotsErr('Please select a date and time');
      return;
    }

    setBusy(true);
    setErr('');
    try {
      await axios.post(
        `${API_URL}/appointments/${appointment._id}/reschedule`,
        { patientId: patient._id, date: rescheduleDate, time: selectedTime },
        { headers: { 'Content-Type': 'application/json', ...authHeaders } }
      );
      doneCb?.();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to reschedule appointment');
    } finally {
      setBusy(false);
    }
  };

  const details = useMemo(() => {
    if (!appointment) return [];
    return [
      { k: 'Doctor', v: doctorMeta.name },
      { k: 'Doctor specialization', v: doctorMeta.specialization },
      { k: 'Doctor verified', v: doctorMeta.verified ? 'Yes' : 'No' },
      { k: 'Doctor online', v: doctorMeta.online ? 'Online' : 'Offline' },
      { k: 'Doctor rating', v: doctorMeta.rating != null ? `${doctorMeta.rating}${doctorMeta.totalReviews != null ? ` (${doctorMeta.totalReviews} reviews)` : ''}` : '—' },

      { k: 'Appointment status', v: appointment?.status || '—' },
      { k: 'Type', v: appointment?.type || '—' },
      { k: 'Scheduled at', v: scheduledText },
      { k: 'Date', v: appointment?.date || '—' },
      { k: 'Start time', v: appointment?.startTime || '—' },
      { k: 'End time', v: appointment?.endTime || '—' },

      { k: 'Fee', v: appointment?.fee != null ? String(appointment.fee) : '—' },
      { k: 'Payment status', v: appointment?.paymentStatus || '—' },
      { k: 'Payment method', v: appointment?.paymentMethod || '—' },
      { k: 'Slot ID', v: appointment?.slotId ? String(appointment.slotId) : '—' },

      { k: 'Notes', v: appointment?.notes || '—' },

      ...(isCancelled
        ? [
            { k: 'Cancelled at', v: appointment?.cancelledAt ? new Date(appointment.cancelledAt).toLocaleString() : '—' },
            { k: 'Cancel reason', v: appointment?.cancelReason || '—' }
          ]
        : [])
    ];
  }, [appointment, doctorMeta, isCancelled, scheduledText]);

  if (!open) return null;

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onClose}
          className="inline-flex w-fit items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          ← Back to list
        </button>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
          {/* NEW: Reschedule */}
          {(appointment?.status || '').toLowerCase() === 'booked' && (
            <button
              onClick={() => {
                setErr('');
                setSlotsErr('');
                const initial = appointment?.date || '';
                setRescheduleDate(initial);
                setRescheduleOpen(true);
                if (initial) fetchFreeSlots(initial);
              }}
              disabled={busy}
              className="inline-flex w-fit items-center justify-center rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100 disabled:opacity-60"
            >
              Reschedule
            </button>
          )}

          {/* ...existing code... Cancel appointment button */}
          {(appointment?.status || '').toLowerCase() === 'booked' && (
            <button
              onClick={() => {
                setErr('');
                setCancelReason('');
                setCancelOpen(true);
              }}
              disabled={busy}
              className="inline-flex w-fit items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel appointment
            </button>
          )}
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Doctor header */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
            {doctorMeta.profileImage ? (
              <img src={doctorMeta.profileImage} alt={doctorMeta.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-lg font-semibold text-gray-900">{doctorMeta.name}</div>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  doctorMeta.online ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
                ].join(' ')}
              >
                {doctorMeta.online ? 'Online' : 'Offline'}
              </span>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  doctorMeta.verified ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
                ].join(' ')}
              >
                {doctorMeta.verified ? 'Verified' : 'Not verified'}
              </span>

              <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-200">
                Rating: {doctorMeta.rating != null ? doctorMeta.rating : '—'}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-600">
              <span className="text-gray-500">Specialization:</span> {doctorMeta.specialization}
            </div>

            {doctorMeta.qualifications.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {doctorMeta.qualifications.slice(0, 8).map((q) => (
                  <span key={q} className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
                    {q}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Appointment details</div>
          <div className="mt-1 text-xs text-gray-600">
            Appointment ID: <span className="font-mono">{appointment?._id || '—'}</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {details.map((row) => (
            <div key={row.k} className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-1 sm:gap-3 px-4 py-3">
              <div className="text-sm font-medium text-gray-800">{row.k}</div>
              <div className="text-sm text-gray-700 break-words whitespace-pre-wrap">{String(row.v ?? '—')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Cancel popup */}
      {cancelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="text-base font-semibold text-gray-900">Cancel appointment</div>
              <div className="mt-1 text-sm text-gray-600">
                Please tell us why you want to cancel (optional).
              </div>
            </div>

            <div className="px-4 py-4">
              <label className="block text-sm font-medium text-gray-800">Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                placeholder="Eg: Not available at that time..."
              />

              <div className="mt-3 text-xs text-gray-600">
                By cancelling, you agree to our{' '}
                <a
                  href="/terms-and-conditions#cancellation"
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-700 hover:underline"
                >
                  Terms &amp; Conditions for cancellation
                </a>
                .
              </div>
            </div>

            <div className="px-4 py-3 border-t bg-white flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelOpen(false)}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await cancelAppointment(cancelReason);
                  // if cancel succeeded, parent will close details; still close popup defensively
                  setCancelOpen(false);
                }}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'Cancelling...' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Reschedule popup */}
      {rescheduleOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRescheduleOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="text-base font-semibold text-gray-900">Reschedule appointment</div>
              <div className="mt-1 text-sm text-gray-600">Pick a date and choose from available free slots.</div>
            </div>

            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-800">Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRescheduleDate(v);
                    setSlotsErr('');
                    if (v) fetchFreeSlots(v);
                  }}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-800">Free slots</label>
                  <button
                    type="button"
                    onClick={() => rescheduleDate && fetchFreeSlots(rescheduleDate)}
                    disabled={slotsLoading || !rescheduleDate}
                    className="text-xs font-medium text-green-700 hover:underline disabled:opacity-60"
                  >
                    Refresh slots
                  </button>
                </div>

                <div className="mt-2">
                  {slotsLoading && (
                    <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-600">
                      Loading slots...
                    </div>
                  )}

                  {slotsErr && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {slotsErr}
                    </div>
                  )}

                  {!slotsLoading && !slotsErr && slots.length === 0 && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                      No free slots found for this date.
                    </div>
                  )}

                  {!slotsLoading && slots.length > 0 && (
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">Select a time</option>
                      {slots.map((s) => (
                        <option key={s.time} value={s.time}>
                          {s.time}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  By rescheduling, you agree to our{' '}
                  <a
                    href="/terms-and-conditions#rescheduling"
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 hover:underline"
                  >
                    Terms &amp; Conditions for rescheduling
                  </a>
                  .
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t bg-white flex items-center justify-end gap-2">
              <button
                onClick={() => setRescheduleOpen(false)}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await rescheduleAppointment();
                  setRescheduleOpen(false);
                }}
                disabled={busy || !rescheduleDate || !selectedTime}
                className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'Rescheduling...' : 'Confirm reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDeatilsModel;
