'use client';

import React from 'react';

interface SMSIntegrationProps {
  sessionId: string;
}

const SMSIntegration: React.FC<SMSIntegrationProps> = ({ sessionId }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-start gap-4">
        <div className="text-3xl">📱</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            SMS Integration (Coming Soon)
          </h3>
          <p className="text-gray-700 mb-4">
            Allow participants to join and respond via text messages using a short code.
          </p>

          <div className="bg-white rounded-md p-4 border border-gray-200 mb-4">
            <div className="text-sm text-gray-600 mb-2">Future SMS Instructions:</div>
            <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
              Text "JOIN {sessionId}" to 12345
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Participants text responses directly to your poll</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Real-time word cloud updates from SMS and web</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>No app download required for participants</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">⏳</span>
              <span>Integration with Twilio SMS service</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              SMS integration will enable broader participation by allowing responses via text message,
              perfect for live events, conferences, and community engagement where not everyone has internet access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSIntegration;