'use client';

import React, { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface JoinSessionProps {
  onSessionJoined?: () => void;
}

const JoinSession: React.FC<JoinSessionProps> = ({ onSessionJoined }) => {
  const [sessionId, setSessionId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { joinSession, isConnected } = useSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim() || !isConnected) return;

    setIsJoining(true);
    try {
      joinSession(sessionId.trim().toUpperCase());
      onSessionJoined?.();
    } catch (error) {
      console.error('Error joining session:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const formatSessionId = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    return value.toUpperCase().slice(0, 6);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Join Live Poll
        </h2>
        <p className="text-gray-600">
          Enter the session ID to participate in a live poll
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-2">
            Session ID
          </label>
          <input
            type="text"
            id="sessionId"
            value={sessionId}
            onChange={(e) => setSessionId(formatSessionId(e.target.value))}
            placeholder="ABC123"
            disabled={isJoining || !isConnected}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-center text-lg font-mono tracking-wider"
            maxLength={6}
            required
          />
          <div className="text-xs text-gray-500 text-center mt-1">
            6-character code (e.g., ABC123)
          </div>
        </div>

        <button
          type="submit"
          disabled={sessionId.length !== 6 || isJoining || !isConnected}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isJoining ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Joining...
            </>
          ) : (
            <>
              🎯 Join Poll
            </>
          )}
        </button>

        {!isConnected && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            ⚠️ Connecting to server... Please wait.
          </div>
        )}
      </form>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="text-sm font-medium text-green-800 mb-2">What happens next:</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• You'll see the poll question and current responses</li>
          <li>• Submit your own text responses</li>
          <li>• Watch the word cloud grow in real-time</li>
          <li>• See how many others are participating</li>
        </ul>
      </div>
    </div>
  );
};

export default JoinSession;