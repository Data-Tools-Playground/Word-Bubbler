'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Response {
  id: string;
  text: string;
  timestamp: Date;
  participantId: string;
}

interface Session {
  id: string;
  title: string;
  question: string;
  participants: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentSession: Session | null;
  responses: Response[];
  participantCount: number;

  // Actions
  createSession: (title: string, question: string) => void;
  joinSession: (sessionId: string) => void;
  submitResponse: (text: string) => void;
  leaveSession: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  // Generate a unique participant ID
  const [participantId] = useState(() =>
    Math.random().toString(36).substring(2, 15)
  );

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket',
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('session-created', (data) => {
      setCurrentSession(data.session);
      setResponses([]);
      setParticipantCount(data.session.participants);

      // Update URL without reload
      window.history.pushState({}, '', `/session/${data.sessionId}`);
    });

    socketInstance.on('session-data', (data) => {
      setCurrentSession(data.session);
      setResponses(data.responses.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })));
      setParticipantCount(data.session.participants);
    });

    socketInstance.on('session-not-found', () => {
      alert('Session not found. Please check the session ID.');
    });

    socketInstance.on('new-response', (response) => {
      setResponses(prev => [...prev, {
        ...response,
        timestamp: new Date(response.timestamp)
      }]);
    });

    socketInstance.on('participant-update', (count) => {
      setParticipantCount(count);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createSession = (title: string, question: string) => {
    if (socket) {
      socket.emit('create-session', { title, question });
    }
  };

  const joinSession = (sessionId: string) => {
    if (socket) {
      socket.emit('join-session', sessionId);
    }
  };

  const submitResponse = (text: string) => {
    if (socket && currentSession) {
      socket.emit('submit-response', {
        sessionId: currentSession.id,
        text,
        participantId
      });
    }
  };

  const leaveSession = () => {
    if (socket && currentSession) {
      socket.emit('leave-session', currentSession.id);
      setCurrentSession(null);
      setResponses([]);
      setParticipantCount(0);
      window.history.pushState({}, '', '/');
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    currentSession,
    responses,
    participantCount,
    createSession,
    joinSession,
    submitResponse,
    leaveSession
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};