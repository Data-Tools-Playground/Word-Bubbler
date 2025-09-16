'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import WordCloud from './WordCloud';
import TextInput from './TextInput';
import SMSIntegration from './SMSIntegration';
import { calculateWordFrequencies, createWordCloudData } from '@/utils/textProcessor';

const LiveSession: React.FC = () => {
  const {
    currentSession,
    responses,
    participantCount,
    submitResponse,
    leaveSession,
    isConnected
  } = useSocket();

  const [wordCloudData, setWordCloudData] = useState<Array<{text: string; size: number; frequency: number}>>([]);

  useEffect(() => {
    if (responses.length > 0) {
      const responseTexts = responses.map(r => r.text);
      const frequencies = calculateWordFrequencies(responseTexts);
      const data = createWordCloudData(frequencies);
      setWordCloudData(data);
    } else {
      setWordCloudData([]);
    }
  }, [responses]);

  const handleResponseSubmit = (text: string) => {
    submitResponse(text);
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/session/${currentSession?.id}`
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Session URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!currentSession) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-lg text-gray-600">No active session</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{currentSession.title}</h1>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? '🟢 Live' : '🔴 Disconnected'}
              </span>
            </div>
            <p className="text-lg text-gray-700 mb-3">{currentSession.question}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Session ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{currentSession.id}</code></span>
              <span>👥 {participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
              <span>💬 {responses.length} response{responses.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              📋 Copy Share Link
            </button>
            <button
              onClick={leaveSession}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              🚪 Leave Session
            </button>
          </div>
        </div>
      </div>

      {/* Response Input */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Submit Your Response</h2>
        <TextInput
          onSubmit={handleResponseSubmit}
          placeholder="Share your thoughts here..."
          disabled={!isConnected}
        />
      </div>

      {/* SMS Integration */}
      <SMSIntegration sessionId={currentSession.id} />

      {/* Word Cloud */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Live Word Cloud
        </h2>
        {wordCloudData.length > 0 ? (
          <div className="flex justify-center">
            <WordCloud words={wordCloudData} width={1000} height={500} />
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-lg">Waiting for responses...</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Live Responses Feed */}
      {responses.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Live Responses ({responses.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {responses.slice().reverse().map((response) => (
              <div
                key={response.id}
                className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500 animate-fadeIn"
              >
                <p className="text-gray-800">&ldquo;{response.text}&rdquo;</p>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(response.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSession;