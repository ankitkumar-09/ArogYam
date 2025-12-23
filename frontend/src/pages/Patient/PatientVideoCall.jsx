import React, { useEffect, useMemo, useState } from "react";
import PatientNavbar from '../../patientComponent/PatientNavbar';
import PatientFooter from '../../patientComponent/PatientFooter';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PROTO_DOCTOR_ID = 'doctor@gmail.com';
const PROTO_PATIENT_ID = 'patient@gmail.com';
const PROTO_CALL_ROOM_ID = `call_${PROTO_DOCTOR_ID}_${PROTO_PATIENT_ID}`;

export default function PatientVideoCall(){
  const nav = useNavigate();
  const { isConnected, currentUser, joinVideoRoom, onIncomingCall, onCallScheduled } = useSocket();
  const patientId = PROTO_PATIENT_ID;

  const [sessions, setSessions] = useState([]);
  const [incoming, setIncoming] = useState(null);

  const load = async () => {
    const res = await fetch(`${API_URL}/api/calls/schedule?patientId=${encodeURIComponent(patientId)}`).catch(() => null);
    const data = res && res.ok ? await res.json() : null;
    setSessions(data?.items || []);
  };

  useEffect(() => { if (patientId) load(); }, [patientId]);

  useEffect(() => {
    const unsub = onCallScheduled((s) => {
      if (String(s?.patientId) === String(patientId)) load();
    });
    return () => unsub?.();
  }, [patientId, onCallScheduled]);

  useEffect(() => {
    if (!isConnected) return;

    onIncomingCall((payload) => {
      // payload: { roomId, callerId, callerData, timestamp }
      setIncoming(payload);
    });
  }, [isConnected, onIncomingCall]);

  const upcoming = useMemo(() => sessions.filter(s => s.status === 'scheduled'), [sessions]);

  const accept = () => {
    if (!incoming) return;
    joinVideoRoom(PROTO_CALL_ROOM_ID, PROTO_PATIENT_ID, 'patient', currentUser || { id: PROTO_PATIENT_ID, type: 'patient' });
    setIncoming(null);
    nav(`/patient/video-call/${encodeURIComponent(PROTO_CALL_ROOM_ID)}`);
  };

  const join = (s) => {
    joinVideoRoom(PROTO_CALL_ROOM_ID, PROTO_PATIENT_ID, 'patient', currentUser || { id: PROTO_PATIENT_ID, type: 'patient' });
    nav(`/patient/video-call/${encodeURIComponent(PROTO_CALL_ROOM_ID)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />
      <main className="pt-16 lg:pt-0 lg:pl-64 p-6">
        <h1 className="text-xl font-semibold mb-4">Video Sessions (Prototype)</h1>

        {!isConnected && <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded mb-3">Reconnecting…</div>}

        {incoming && (
          <div className="mb-4 bg-white border rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">Incoming call from {incoming.callerId}</div>
              <div className="text-sm text-gray-500">Room: {incoming.roomId}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIncoming(null)} className="px-3 py-2 border rounded">Decline</button>
              <button onClick={accept} className="px-3 py-2 bg-blue-600 text-white rounded">Accept</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {upcoming.length === 0 && <div className="text-gray-500">No upcoming video sessions.</div>}
          {upcoming.map(s => (
            <div key={s._id} className="bg-white p-4 rounded shadow flex items-center justify-between">
              <div>
                <div className="font-medium">Doctor: {s.doctorId}</div>
                <div className="text-sm text-gray-500">{new Date(s.scheduledFor).toLocaleString()}</div>
                <div className="text-xs text-gray-400">Room: {s.roomId}</div>
              </div>
              <button onClick={() => join(s)} className="px-3 py-2 bg-blue-600 text-white rounded">Join</button>
            </div>
          ))}
        </div>
      </main>
      <PatientFooter />
    </div>
  );
}
