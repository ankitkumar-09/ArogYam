// PatientChats.jsx
import React, { useState, useEffect, useMemo } from 'react';
import DoctorNavbar from '../../doctorComponent/DoctorNavbar';
import { Link } from 'react-router-dom';
import { FaCommentMedical, FaUserCircle, FaClock } from 'react-icons/fa';
import { useSocket } from '../../contexts/SocketContext';

const PROTO_PATIENT_ID = 'patient@gmail.com';

const PatientChats = () => {
  const { socket, isConnected } = useSocket();

  const [patients, setPatients] = useState([
    {
      id: PROTO_PATIENT_ID,
      name: 'patient@gmail.com',
      lastMessage: '—',
      time: '—',
      unread: 0,
      online: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!socket || !isConnected) return;

    const markOnline = (userId, online) => {
      setPatients(prev => prev.map(p => (String(p.id) === String(userId) ? { ...p, online } : p)));
    };

    const onUserOnline = ({ userId }) => markOnline(userId, true);
    const onUserOffline = ({ userId }) => markOnline(userId, false);
    const onPresence = ({ userId, status }) => markOnline(userId, status === 'online');

    socket.on('user-online', onUserOnline);
    socket.on('user-offline', onUserOffline);
    socket.on('presence-update', onPresence);

    return () => {
      socket.off('user-online', onUserOnline);
      socket.off('user-offline', onUserOffline);
      socket.off('presence-update', onPresence);
    };
  }, [socket, isConnected]);

  const filteredPatients = useMemo(
    () => patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [patients, searchTerm]
  );

  const onlineCount = useMemo(() => patients.filter(p => p.online).length, [patients]);
  const unreadCount = useMemo(() => patients.reduce((sum, p) => sum + (p.unread || 0), 0), [patients]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />
      
      <main className="p-4 md:p-6 lg:ml-64">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome back, Dr. Satyal</h1>
            <p className="text-gray-500">Friday, December 19, 2025</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Patient List */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                  <FaCommentMedical className="text-red-500" />
                  Patient Chats
                </h2>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaUserCircle className="absolute left-3 top-3.5 text-gray-400" />
                </div>

                <div className="space-y-3">
                  {filteredPatients.map((patient) => (
                    <Link
                      key={patient.id}
                      to={`/doctor/chat/${patient.id}`}
                      className="block p-3 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <FaUserCircle className="text-red-500 text-xl" />
                            </div>
                            {patient.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <FaClock className="text-xs" />
                              {patient.time}
                            </div>
                          </div>
                        </div>
                        {patient.unread > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {patient.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{patient.lastMessage}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Area - Placeholder */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border">
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <FaCommentMedical className="text-red-500 text-4xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a patient to start chatting</h3>
                <p className="text-gray-500">Choose from the patient list to view messages and start conversation</p>
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-green-600">{onlineCount}</span>
                    </div>
                    <p className="text-sm text-gray-600">Online</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-blue-600">{unreadCount}</span>
                    </div>
                    <p className="text-sm text-gray-600">Unread</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientChats;