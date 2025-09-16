import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: {
    server: NetServer & {
      io?: ServerIO;
    };
  };
}

interface PollSession {
  id: string;
  title: string;
  question: string;
  responses: Array<{
    id: string;
    text: string;
    timestamp: Date;
    participantId: string;
  }>;
  participants: number;
  createdAt: Date;
}

// In-memory storage for sessions (in production, use a database)
const pollSessions = new Map<string, PollSession>();

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');

    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://data-tools-playground.github.io']
          : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join a poll session
      socket.on('join-session', (sessionId: string) => {
        socket.join(sessionId);
        const session = pollSessions.get(sessionId);

        if (session) {
          session.participants++;
          socket.emit('session-data', {
            session: {
              id: session.id,
              title: session.title,
              question: session.question,
              participants: session.participants
            },
            responses: session.responses
          });

          // Notify others about participant count
          socket.to(sessionId).emit('participant-update', session.participants);
        } else {
          socket.emit('session-not-found');
        }
      });

      // Create a new poll session
      socket.on('create-session', (data: { title: string; question: string }) => {
        const sessionId = generateSessionId();
        const session: PollSession = {
          id: sessionId,
          title: data.title,
          question: data.question,
          responses: [],
          participants: 1,
          createdAt: new Date()
        };

        pollSessions.set(sessionId, session);
        socket.join(sessionId);

        socket.emit('session-created', {
          sessionId,
          session: {
            id: session.id,
            title: session.title,
            question: session.question,
            participants: session.participants
          }
        });
      });

      // Submit a response
      socket.on('submit-response', (data: { sessionId: string; text: string; participantId: string }) => {
        const session = pollSessions.get(data.sessionId);

        if (session) {
          const response = {
            id: generateResponseId(),
            text: data.text,
            timestamp: new Date(),
            participantId: data.participantId
          };

          session.responses.push(response);

          // Broadcast to all participants in the session
          io.to(data.sessionId).emit('new-response', response);
        }
      });

      // Leave session
      socket.on('leave-session', (sessionId: string) => {
        const session = pollSessions.get(sessionId);
        if (session && session.participants > 0) {
          session.participants--;
          socket.to(sessionId).emit('participant-update', session.participants);
        }
        socket.leave(sessionId);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateResponseId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const config = {
  api: {
    bodyParser: false,
  },
};