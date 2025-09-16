'use client';

import React, { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface CreateSessionProps {
  onSessionCreated?: () => void;
}

const CreateSession: React.FC<CreateSessionProps> = ({ onSessionCreated }) => {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createSession, isConnected } = useSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim() || !isConnected) return;

    setIsCreating(true);
    try {
      createSession(title.trim(), question.trim());
      onSessionCreated?.();
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Live Poll Session
        </h2>
        <p className="text-gray-600">
          Start a real-time word cloud poll that others can join and participate in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Customer Feedback Session"
            disabled={isCreating || !isConnected}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are your thoughts on our new product features?"
            disabled={isCreating || !isConnected}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
            rows={3}
            maxLength={500}
            required
          />
          <div className="text-sm text-gray-500 text-right mt-1">
            {question.length}/500 characters
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !question.trim() || isCreating || !isConnected}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Session...
            </>
          ) : (
            <>
              🚀 Create Live Poll
            </>
          )}
        </button>

        {!isConnected && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            ⚠️ Connecting to server... Please wait.
          </div>
        )}
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• You'll get a unique session ID that others can use to join</li>
          <li>• Participants can submit responses via web or SMS (coming soon)</li>
          <li>• Watch the word cloud update in real-time as responses come in</li>
          <li>• Perfect for workshops, meetings, and live events</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateSession;