// VideoCall.jsx
import React, { useEffect, useRef, useState } from 'react';
import DoctorNavbar from './DoctorNavbar';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import {
  FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash,
  FaUser, FaStethoscope, FaClipboard
} from 'react-icons/fa';

const PROTO_DOCTOR_ID = 'doctor@gmail.com';
const PROTO_PATIENT_ID = 'patient@gmail.com';

const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] };

const VideoCall = () => {
  const nav = useNavigate();
  const { sessionId } = useParams();
  const { socket, isConnected, currentUser, joinVideoRoom, leaveVideoRoom, sendOffer, sendAnswer, sendIceCandidate, endCall } = useSocket();

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [patientNotes, setPatientNotes] = useState('');

  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const timerRef = useRef(null);

  const meId = currentUser?.id || PROTO_DOCTOR_ID;
  const meType = currentUser?.type || (meId === PROTO_PATIENT_ID ? 'patient' : 'doctor');
  const otherId = meId === PROTO_DOCTOR_ID ? PROTO_PATIENT_ID : PROTO_DOCTOR_ID;

  const ensurePC = () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE);

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const targetSocketId = remoteSocketIdRef.current;
      if (!targetSocketId) return;
      sendIceCandidate(sessionId, e.candidate, targetSocketId);
    };

    pc.ontrack = (e) => {
      if (remoteVideoEl.current) remoteVideoEl.current.srcObject = e.streams[0];
    };

    pcRef.current = pc;
    return pc;
  };

  const startLocalMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // apply initial toggle state
    stream.getVideoTracks().forEach(t => (t.enabled = !!videoEnabled));
    stream.getAudioTracks().forEach(t => (t.enabled = !!audioEnabled));

    localStreamRef.current = stream;
    if (localVideoEl.current) localVideoEl.current.srcObject = stream;

    const pc = ensurePC();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    return stream;
  };

  const makeOfferTo = async (targetSocketId) => {
    remoteSocketIdRef.current = targetSocketId;
    await startLocalMedia();

    const pc = ensurePC();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendOffer(sessionId, offer, targetSocketId);
  };

  useEffect(() => {
    if (!isConnected || !socket || !sessionId) return;

    // timer
    timerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);

    // join room (server uses socket.userId, still pass for compatibility)
    joinVideoRoom(sessionId, meId, meType, currentUser || { id: meId, type: meType });

    const onParticipants = async (payload) => {
      if (payload?.roomId !== sessionId) return;
      const first = payload?.participants?.[0];
      if (!first?.socketId) return;

      // doctor is initiator in prototype
      if (meId === PROTO_DOCTOR_ID) await makeOfferTo(first.socketId);
    };

    const onUserJoined = async (payload) => {
      if (payload?.roomId !== sessionId) return;
      if (!payload?.socketId) return;

      if (meId === PROTO_DOCTOR_ID) await makeOfferTo(payload.socketId);
    };

    const onOfferEvt = async ({ roomId, offer, fromSocketId }) => {
      if (roomId !== sessionId) return;
      remoteSocketIdRef.current = fromSocketId;

      await startLocalMedia();
      const pc = ensurePC();

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendAnswer(sessionId, answer, fromSocketId);
    };

    const onAnswerEvt = async ({ roomId, answer }) => {
      if (roomId !== sessionId) return;
      const pc = ensurePC();
      await pc.setRemoteDescription(answer);
    };

    const onIceEvt = async ({ roomId, candidate }) => {
      if (roomId !== sessionId) return;
      const pc = ensurePC();
      if (candidate) await pc.addIceCandidate(candidate);
    };

    socket.on('video-room-participants', onParticipants);
    socket.on('user-joined-video', onUserJoined);
    socket.on('offer', onOfferEvt);
    socket.on('answer', onAnswerEvt);
    socket.on('ice-candidate', onIceEvt);

    // eager media so camera prompt happens immediately
    startLocalMedia().catch(() => {});

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);

      socket.off('video-room-participants', onParticipants);
      socket.off('user-joined-video', onUserJoined);
      socket.off('offer', onOfferEvt);
      socket.off('answer', onAnswerEvt);
      socket.off('ice-candidate', onIceEvt);

      leaveVideoRoom(sessionId, meId);

      try {
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;

      const s = localStreamRef.current;
      if (s) s.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      remoteSocketIdRef.current = null;
    };
  }, [isConnected, socket, sessionId, meId, meType]);

  useEffect(() => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getVideoTracks().forEach(t => (t.enabled = !!videoEnabled));
  }, [videoEnabled]);

  useEffect(() => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach(t => (t.enabled = !!audioEnabled));
  }, [audioEnabled]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const hangup = () => {
    // best-effort: notify room
    endCall?.(sessionId, meId);
    if (meType === 'patient') nav('/patient/video-sessions');
    else nav('/doctor/video-sessions');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <DoctorNavbar />
      
      <div className="p-4">
        {/* Call Header */}
        <div className="max-w-6xl mx-auto mb-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <FaStethoscope className="text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Video Consultation</h1>
                <p className="text-gray-300">Session ID: {sessionId}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold">{formatTime(callDuration)}</div>
              <div className="text-sm text-gray-300">Duration</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Remote Video (Patient) */}
            <div className="bg-gray-800 rounded-xl overflow-hidden relative h-[400px]">
              <video
                ref={remoteVideoEl}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
                  Reconnecting…
                </div>
              )}
            </div>

            {/* Local Video (Doctor) */}
            <div className="bg-gray-800 rounded-xl overflow-hidden relative h-[200px]">
              <video
                ref={localVideoEl}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover bg-black"
              />
              <div className="absolute top-2 right-2 text-sm text-white bg-black/50 px-2 py-1 rounded">
                You ({meId})
              </div>
            </div>
          </div>

          {/* Controls and Notes Sidebar */}
          <div className="space-y-4">
            {/* Call Controls */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FaVideo />
                Call Controls
              </h3>
              
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => setVideoEnabled(v => !v)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    videoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                  } transition`}
                >
                  {videoEnabled ? (
                    <FaVideo className="text-white text-xl" />
                  ) : (
                    <FaVideoSlash className="text-white text-xl" />
                  )}
                </button>
                
                <button
                  onClick={() => setAudioEnabled(a => !a)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    audioEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                  } transition`}
                >
                  {audioEnabled ? (
                    <FaMicrophone className="text-white text-xl" />
                  ) : (
                    <FaMicrophoneSlash className="text-white text-xl" />
                  )}
                </button>
                
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-700">
                  <FaStethoscope className="text-white text-xl" />
                </div>
              </div>
              
              <button
                onClick={hangup}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <FaPhoneSlash />
                End Call
              </button>
              
              <div className="mt-3 text-sm text-gray-300 text-center">
                With: {otherId} • {formatTime(callDuration)}
              </div>
            </div>

            {/* Patient Notes */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FaClipboard />
                Notes
              </h3>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Notes…"
                className="w-full h-32 bg-gray-900 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Room Info */}
            <div className="bg-gray-800 rounded-xl p-4 text-white text-sm">
              Room: {sessionId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;