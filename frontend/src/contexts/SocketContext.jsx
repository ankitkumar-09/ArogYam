// contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../utils/socket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ Prototype-only identities
  const PROTO_DOCTOR_ID = 'doctor@gmail.com';
  const PROTO_PATIENT_ID = 'patient@gmail.com';

  // ensure we have a stable user id / basic user data
  const getOrCreateLocalUser = () => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const inferredType = path.startsWith('/patient') ? 'patient' : 'doctor';

    // ✅ always force these two users (prevents backend allowlist rejection)
    const forcedId = inferredType === 'patient' ? PROTO_PATIENT_ID : PROTO_DOCTOR_ID;

    try {
      const key = 'dc_user';
      const raw = localStorage.getItem(key);

      // if existing user is not allowed, overwrite
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const allowed =
            (parsed?.id === PROTO_DOCTOR_ID && (parsed?.type === 'doctor' || inferredType === 'doctor')) ||
            (parsed?.id === PROTO_PATIENT_ID && (parsed?.type === 'patient' || inferredType === 'patient'));

          if (allowed) return { ...parsed, type: inferredType };
        } catch (_) {}
      }

      const user = { id: forcedId, type: inferredType, email: forcedId };
      localStorage.setItem(key, JSON.stringify(user));
      return user;
    } catch (e) {
      return { id: forcedId, type: inferredType, email: forcedId };
    }
  };

  useEffect(() => {
    const localUser = getOrCreateLocalUser();
    setCurrentUser(localUser);

    const token = localStorage.getItem('token') || null;

    // Connect to socket with stable user info
    const socket = socketService.connect(localUser.id, localUser.type || 'doctor', localUser, token);

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setSocketError(null);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketError(error.message);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      socketService.removeAllListeners();
    };
  }, []);

  const reconnectSocket = () => {
    socketService.reconnect();
  };

  const value = {
    socket: socketService.getSocket(),
    isConnected,
    socketError,
    reconnectSocket,
    currentUser,

    // Chat methods
    joinChatRoom: socketService.joinChatRoom,
    leaveChatRoom: socketService.leaveChatRoom,
    sendMessage: socketService.sendMessage,
    onReceiveMessage: socketService.onReceiveMessage,
    onTyping: socketService.onTyping,
    sendTyping: socketService.sendTyping,

    // Video call / signaling methods (mapped to existing service methods)
    joinVideoRoom: socketService.joinVideoRoom,
    leaveVideoRoom: socketService.leaveVideoRoom,
    sendOffer: socketService.sendOffer,
    sendAnswer: socketService.sendAnswer,
    sendIceCandidate: socketService.sendIceCandidate,
    onOffer: socketService.onOffer,
    onAnswer: socketService.onAnswer,
    onIceCandidate: socketService.onIceCandidate,
    onUserJoinedVideo: socketService.onUserJoinedVideo,
    onUserLeftVideo: socketService.onUserLeftVideo,
    // + expose participants list listener
    onVideoRoomParticipants: socketService.onVideoRoomParticipants,
    toggleAudioVideo: socketService.toggleAudioVideo,
    startCall: socketService.startCall,
    endCall: socketService.endCall,
    onIncomingCall: socketService.onIncomingCall,
    onCallEnded: socketService.onCallEnded,
    onCallToggled: socketService.onCallToggled,

    // + Call scheduling (prototype)
    scheduleCall: socketService.scheduleCall,
    onCallScheduled: socketService.onCallScheduled,

    // Notification methods
    subscribeToNotifications: socketService.subscribeToNotifications,
    onNotification: socketService.onNotification,

    // Presence methods
    setOnlineStatus: socketService.setOnlineStatus,
    onPresenceUpdate: socketService.onPresenceUpdate,

    // Error handling
    onError: socketService.onError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};