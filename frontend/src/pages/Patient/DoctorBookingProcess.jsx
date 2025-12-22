import React, { useEffect, useState, useContext, useMemo } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { MdEmail, MdPhone, MdChat, MdCall, MdVideocam, MdStar } from 'react-icons/md'
import PatientContext from '../../contexts/PatientContext'
import PatientNavbar from '../../patientComponent/PatientNavbar'
import noProfile from '../../assets/noProfile.webp'

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return ''
  const parts = email.split('@')
  if (parts.length !== 2) return email[0] ? `${email[0]}***` : ''
  const [local, domain] = parts
  const localMasked = local.length > 2 ? local[0] + '***' + local.slice(-1) : (local[0] || '') + '*'
  const domainParts = (domain || '').split('.')
  const domainMain = domainParts[0] || ''
  const domainMasked = domainMain ? domainMain[0] + '***' : '***'
  const tld = domainParts.slice(1).join('.') || '***'
  return `${localMasked}@${domainMasked}.${tld}`
}

const maskPhone = (phone) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g,'')
  if (digits.length <= 4) return '****'
  const last = digits.slice(-3)
  return '****' + last
}

const DoctorBookingProcess = () => {
  const { doctorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { patient } = useContext(PatientContext) || {};
  // console.log("Patient Context:", patient);
  const [doctor, setDoctor] = useState(location.state?.doctor || null);
  const [loading, setLoading] = useState(!doctor);
  const [revealContact, setRevealContact] = useState(false);//untill payment will not happpens later on it will be implemented

  const [mode, setMode] = useState('video');

  const [message, setMessage] = useState('');

  const getLocalYYYYMMDD = (date = new Date()) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalYYYYMMDD();

  const nextDates = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const days = 7; // today + next 6 days
    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(getLocalYYYYMMDD(d));
    }
    return out;
  }, []);

  // NEW: date + availability fetch (log only for now)
  const [selectedDate, setSelectedDate] = useState(() => getLocalYYYYMMDD()); // YYYY-MM-DD

  // NEW: availability state for UI
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availability, setAvailability] = useState({ slots: [], bookedSlots: [], slotDurationMinutes: 15 });

  const [selectedSlot, setSelectedSlot] = useState(null);

  const normalizeTime = (t) => String(t ?? '').trim();

  const bookedTimes = useMemo(() => {
    const raw = availability?.bookedSlots ?? [];
    const times = raw
      .map((b) => (typeof b === 'string' ? b : b?.time))
      .map(normalizeTime)
      .filter(Boolean);
    return new Set(times);
  }, [availability?.bookedSlots]);

  // NEW: compute full day's slots (free+booked) from doctor's availability window
  const allTimes = useMemo(() => {
    const duration = Number(availability?.slotDurationMinutes) || Number(doctor?.slotDurationMinutes) || 15;

    const parseHHMM = (hhmm) => {
      const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm || '').trim());
      if (!m) return null;
      return { hh: Number(m[1]), mm: Number(m[2]) };
    };
    const minutesToHHMM = (mins) => {
      const hh = String(Math.floor(mins / 60)).padStart(2, '0');
      const mm = String(mins % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    };
    const hhmmToMinutes = (hhmm) => {
      const p = parseHHMM(hhmm);
      if (!p) return null;
      return p.hh * 60 + p.mm;
    };

    const from = doctor?.availability?.from;
    const to = doctor?.availability?.to;
    const pFrom = parseHHMM(from);
    const pTo = parseHHMM(to);

    // fallback: if doctor availability isn't configured, still show whatever API gave us
    if (!pFrom || !pTo) {
      const free = (availability?.slots || []).map(s => normalizeTime(s?.time)).filter(Boolean);
      const booked = Array.from(bookedTimes);
      let merged = Array.from(new Set([...free, ...booked])).sort();

      // hide past times for "today"
      if (selectedDate === todayStr) {
        const now = new Date();
        const nowM = now.getHours() * 60 + now.getMinutes();
        const cutoff = Math.ceil(nowM / Math.max(duration, 1)) * Math.max(duration, 1);
        merged = merged.filter((t) => {
          const tm = hhmmToMinutes(t);
          return tm == null ? true : tm >= cutoff;
        });
      }

      return merged;
    }

    const startM = pFrom.hh * 60 + pFrom.mm;
    const endM = pTo.hh * 60 + pTo.mm;
    if (!(endM > startM) || !(duration > 0)) return [];

    let times = [];
    for (let t = startM; t + duration <= endM; t += duration) times.push(minutesToHHMM(t));

    // hide already-passed slots for current date (round up to next slot boundary)
    if (selectedDate === todayStr) {
      const now = new Date();
      const nowM = now.getHours() * 60 + now.getMinutes();
      const cutoff = Math.ceil(nowM / duration) * duration;
      times = times.filter((hhmm) => {
        const tm = hhmmToMinutes(hhmm);
        return tm == null ? true : tm >= cutoff;
      });
    }

    return times;
  }, [
    availability?.slotDurationMinutes,
    availability?.slots,
    bookedTimes,
    doctor?.availability?.from,
    doctor?.availability?.to,
    doctor?.slotDurationMinutes,
    selectedDate,
    todayStr
  ]);

  // NEW: quick lookup for free slot objects returned by API (contains fee/type)
  const freeSlotByTime = useMemo(() => {
    const m = new Map();
    (availability?.slots || []).forEach((s) => {
      const t = normalizeTime(s?.time);
      if (t) m.set(t, s);
    });
    return m;
  }, [availability?.slots]);

  useEffect(() => {
    if (doctor) return;
    setLoading(true);
    let cancelled = false;

    const load = async () => {
      try {
        // try primary endpoint
        let res;
        try {
          res = await axios.get(`${import.meta.env.VITE_API_URL}/doctors/${doctorId}`);
          console.log("Primary Doctor Data:",res?.data);
        } catch (e) {
          console.log(e.message);
          res = await axios.get(`${import.meta.env.VITE_API_URL}/doctors/search`, {
            params: { doctorId }
          });
        }
        const data = res?.data;
        const doc = data?.success ? data.data : data;
        console.log("Loaded Doctor:", doc);
        if (!cancelled) setDoctor(doc);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [doctor, doctorId]);

  useEffect(() => {
    const docId = doctor?._id || doctorId;
    if (!docId || !selectedDate || !mode) return;

    let cancelled = false;
    setAvailabilityError('');
    setAvailabilityLoading(true);
    setSelectedSlot(null);

    (async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/appointments/availability`, {
          params: { doctorId: docId, date: selectedDate, type: mode }
        });

        if (cancelled) return;

        const data = res?.data?.data || {};
        setAvailability({
          slots: Array.isArray(data?.slots) ? data.slots : [],
          bookedSlots: Array.isArray(data?.bookedSlots) ? data.bookedSlots : [],
          slotDurationMinutes: Number(data?.slotDurationMinutes) || 15,
        });
        console.log(availability);

        // optional: keep logs if needed
        // console.log("Free slots:", data?.slots);
        // console.log("Booked slots:", data?.bookedSlots);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setAvailability({ slots: [], bookedSlots: [], slotDurationMinutes: 15 });
          setAvailabilityError(err?.response?.data?.message || 'Failed to load availability');
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [doctor?._id, doctorId, selectedDate, mode]);

  const unlockContact = async () => {
    // simulate a small purchase flow; reveal locally and optionally ping backend
    try {
      const fee = doctor?.contactRevealFee ?? 50;
      setMessage('Processing payment...');
      // optionally: await axios.post('/payments/reveal-contact', { doctorId, patientId: patient?._id })
      // simulate delay
      await new Promise(r => setTimeout(r, 800));
      setRevealContact(true);
      setMessage(`Contact unlocked for ₹${fee}`);
    } catch (err) {
      setMessage('Payment failed');
    }
  };

  const handleProceed = () => {
    if (!selectedSlot) return;

    const time = normalizeTime(selectedSlot?.time);
    const fee = Number(selectedSlot?.fee ?? doctor?.consultationFee?.[mode] ?? 0);

    navigate('/patient/payment', {
      state: {
        doctorId: doctor?._id || doctorId,
        doctor: { _id: doctor?._id || doctorId, name: doctor?.name }, // keep it small
        patientId: patient?._id,
        date: selectedDate,
        type: mode,
        time,
        fee,
      }
    });
  };

  if (loading) return <div>Loading doctor...</div>;
  if (!doctor) return <div>Doctor not found</div>;

  return (
  <>
    <PatientNavbar />

    <main className="bg-gray-50 min-h-screen pt-16 lg:pt-0 lg:pl-64">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Doctor Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-6">
          <img
            src={doctor.profileImage || noProfile}
            alt={doctor.name}
            className="w-32 h-32 rounded-xl object-cover border"
          />

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">
              {doctor.name}
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              {doctor.specialization} • {doctor.experience} yrs experience
            </p>

            <div className="flex items-center gap-3 mt-3 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium 
                ${doctor.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {doctor.isVerified ? 'Verified' : 'Not Verified'}
              </span>

              <span className={`px-2 py-1 rounded-full text-xs font-medium 
                ${doctor.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {doctor.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
              <MdStar className="text-yellow-500" />
              <span>{doctor.rating ?? 0} Rating • {doctor.totalReviews ?? 0} Reviews</span>
            </div>
          </div>
        </div>

        {/* About + Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

          {/* About */}
          <div className="bg-white rounded-xl p-5 shadow-sm md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-2">About Doctor</h3>
            <p className="text-sm text-gray-600">
              {doctor.bio || 'No bio provided.'}
            </p>

            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-1">Qualifications</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {(doctor.qualifications || []).length === 0
                  ? <li>Not specified</li>
                  : doctor.qualifications.map((q, i) => <li key={i}>{q}</li>)
                }
              </ul>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-1">Languages</h4>
              <p className="text-sm text-gray-600">
                {(doctor.languages || []).join(', ') || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Fees & Availability */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Consultation Fees</h3>

            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <MdChat className="text-gray-500" />
                <span>Chat: ₹{doctor.consultationFee?.chat ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <MdCall className="text-gray-500" />
                <span>Voice: ₹{doctor.consultationFee?.voice ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <MdVideocam className="text-gray-500" />
                <span>Video: ₹{doctor.consultationFee?.video ?? 0}</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-1">Availability</h4>
              <p className="text-sm text-gray-600">
                {doctor.availability?.from || 'N/A'} – {doctor.availability?.to || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
          <h3 className="font-semibold text-gray-800 mb-2">Contact Details</h3>

          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <MdEmail className="text-gray-500" />
              <span>{revealContact ? doctor.email : maskEmail(doctor.email)}</span>
              {!revealContact && (
                <button
                  onClick={unlockContact}
                  className="ml-2 text-xs text-green-600 hover:underline"
                >
                  Unlock for ₹{doctor?.contactRevealFee ?? 50}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MdPhone className="text-gray-500" />
              <span>{revealContact ? doctor.phone : maskPhone(doctor.phone)}</span>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Choose Consultation Mode</h3>

          <div className="flex gap-6 text-sm">
            {['chat', 'voice', 'video', 'in-person'].map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === m}
                  onChange={() => setMode(m)}
                />
                <span className="capitalize">{m}</span>
              </label>
            ))}
          </div>

          {/* Date selection */}
          <div className="mt-4 flex flex-col gap-3">
            {/* NEW: forward-only quick dates (today + next days) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {nextDates.map((d) => {
                const active = d === selectedDate;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={[
                      "whitespace-nowrap border rounded-full px-3 py-1.5 text-xs transition",
                      active ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:border-green-400"
                    ].join(" ")}
                  >
                    {d === todayStr ? `Today (${d})` : d}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700 font-medium">Select date</label>
              <input
                type="date"
                value={selectedDate}
                min={todayStr} // NEW: prevent past dates
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          {/* NEW: Slots UI */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700">Available slots</h4>
              <span className="text-xs text-gray-500">
                {mode} • {selectedDate}
              </span>
            </div>

            {availabilityLoading && (
              <p className="mt-2 text-sm text-gray-500">Loading slots...</p>
            )}

            {!availabilityLoading && availabilityError && (
              <p className="mt-2 text-sm text-red-600">{availabilityError}</p>
            )}

            {!availabilityLoading && !availabilityError && (allTimes?.length ?? 0) === 0 && (
              <p className="mt-2 text-sm text-gray-500">No slots available for the selected date/mode.</p>
            )}

            {!availabilityLoading && !availabilityError && (allTimes?.length ?? 0) > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {allTimes.map((time) => {
                  const isBooked = bookedTimes.has(time);
                  const freeSlot = freeSlotByTime.get(time);
                  const slot = freeSlot || { time, fee: doctor?.consultationFee?.[mode] ?? 0, type: mode };
                  const isSelected = normalizeTime(selectedSlot?.time) === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => { if (!isBooked) setSelectedSlot(slot); }}
                      className={[
                        "border rounded-lg px-2 py-2 text-left transition",
                        isBooked
                          ? "bg-red-50 text-red-800 cursor-not-allowed border-red-200"
                          : "bg-green-50 text-green-900 border-green-200 hover:border-green-500",
                        (!isBooked && isSelected) ? "border-green-600 ring-2 ring-green-200" : "",
                      ].join(' ')}
                      title={isBooked ? "Already booked" : "Select slot"}
                    >
                      <div className="text-sm font-medium">{time}</div>
                      <div className={["text-xs", isBooked ? "text-red-600" : "text-green-700"].join(" ")}>
                        ₹{Number(slot?.fee ?? doctor?.consultationFee?.[mode] ?? 0)}
                      </div>
                      {isBooked && <div className="text-xs text-red-600 mt-1">Already booked</div>}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="text-sm text-gray-700">
                  Selected: <span className="font-medium">{selectedDate}</span> at{" "}
                  <span className="font-medium">{normalizeTime(selectedSlot?.time)}</span>{" "}
                  <span className="text-gray-500">({mode})</span>
                </div>
                <button
                  type="button"
                  onClick={handleProceed}
                  className="px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
                >
                  Proceed
                </button>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-4 text-sm text-red-600">
            {message}
          </div>
        )}
      </div>
    </main>
  </>
  )
}

export default DoctorBookingProcess
