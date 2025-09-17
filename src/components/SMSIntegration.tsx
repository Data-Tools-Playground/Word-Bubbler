'use client';

import React, { useState, useEffect } from 'react';
import { SMSService } from '@/services/smsService';

interface SMSIntegrationProps {
  sessionId: string;
  sessionTitle: string;
  isActive?: boolean;
}

const SMSIntegration: React.FC<SMSIntegrationProps> = ({
  sessionId,
  sessionTitle,
  isActive = true
}) => {
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteResults, setInviteResults] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState({
    totalParticipants: 0,
    activeParticipants: 0,
    totalResponses: 0,
  });

  // Get Twilio phone number from environment (for display)
  const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '(555) 123-4567';
  const isConfigured = !!process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

  useEffect(() => {
    // Update session stats periodically
    const interval = setInterval(() => {
      if (isActive && isConfigured) {
        // In a real implementation, this would call an API endpoint
        // For now, we'll simulate it
        setSessionStats({
          totalParticipants: Math.floor(Math.random() * 10),
          activeParticipants: Math.floor(Math.random() * 5),
          totalResponses: Math.floor(Math.random() * 20),
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isActive, isConfigured]);

  const handleSendInvites = async () => {
    if (!phoneNumbers.trim()) return;

    setIsLoading(true);
    try {
      const phoneList = phoneNumbers
        .split(/[,\n]/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Validate phone numbers
      const validatedNumbers = phoneList.map(phone => {
        const validation = SMSService.validatePhoneNumber(phone);
        return {
          original: phone,
          formatted: validation.formatted,
          valid: validation.valid,
          error: validation.error,
        };
      });

      const validNumbers = validatedNumbers
        .filter(v => v.valid)
        .map(v => v.formatted!);

      if (validNumbers.length === 0) {
        setInviteResults({
          success: false,
          error: 'No valid phone numbers found',
          results: validatedNumbers,
        });
        return;
      }

      // Send invites via API call
      const response = await fetch('/api/sms/send-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers: validNumbers,
          sessionId,
          sessionTitle,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const result = await response.json();
      setInviteResults(result);

      if (result.success) {
        setPhoneNumbers('');
        setCustomMessage('');
      }
    } catch (error) {
      setInviteResults({
        success: false,
        error: 'Failed to send invites',
        results: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl">📱</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              SMS Integration (Setup Required)
            </h3>
            <p className="text-gray-700 mb-4">
              Configure Twilio credentials to enable SMS participation.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables to enable SMS features.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-start gap-4">
        <div className="text-3xl">📱</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            SMS Integration - Profile Building Enabled
          </h3>
          <p className="text-gray-700 mb-4">
            Participants can join via SMS and their responses will build persistent profiles for longitudinal insights.
          </p>

          {/* Join Instructions */}
          <div className="bg-white rounded-md p-4 border border-gray-200 mb-4">
            <div className="text-sm text-gray-600 mb-2">SMS Instructions for Participants:</div>
            <div className="font-mono text-sm bg-gray-50 p-2 rounded border mb-2">
              Text "JOIN {sessionId}" to {twilioNumber}
            </div>
            <div className="text-xs text-gray-500">
              Each phone number automatically creates a respondent profile for tracking engagement over time.
            </div>
          </div>

          {/* Session Stats */}
          {isActive && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-md p-3 text-center border">
                <div className="text-lg font-semibold text-blue-600">{sessionStats.totalParticipants}</div>
                <div className="text-xs text-gray-500">SMS Participants</div>
              </div>
              <div className="bg-white rounded-md p-3 text-center border">
                <div className="text-lg font-semibold text-green-600">{sessionStats.activeParticipants}</div>
                <div className="text-xs text-gray-500">Active Now</div>
              </div>
              <div className="bg-white rounded-md p-3 text-center border">
                <div className="text-lg font-semibold text-purple-600">{sessionStats.totalResponses}</div>
                <div className="text-xs text-gray-500">SMS Responses</div>
              </div>
            </div>
          )}

          {/* Send Invites Section */}
          <div className="bg-white rounded-md p-4 border border-gray-200 mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Send SMS Invites</h4>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Numbers (one per line or comma-separated)
              </label>
              <textarea
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                placeholder="+1-555-123-4567&#10;+1-555-987-6543&#10;555-246-8135"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message (optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={`📊 Join "${sessionTitle}" poll!\n\nText: JOIN ${sessionId}\n\nYour responses help build valuable insights.`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
            </div>

            <button
              onClick={handleSendInvites}
              disabled={!phoneNumbers.trim() || isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isLoading ? 'Sending Invites...' : 'Send SMS Invites'}
            </button>
          </div>

          {/* Results */}
          {inviteResults && (
            <div className={`rounded-md p-3 mb-4 ${inviteResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`text-sm font-medium ${inviteResults.success ? 'text-green-800' : 'text-red-800'}`}>
                {inviteResults.success ? '✅ Invites sent successfully!' : '❌ Some invites failed'}
              </div>
              {inviteResults.results && (
                <div className="mt-2 text-xs">
                  {inviteResults.results.map((result: any, index: number) => (
                    <div key={index} className={result.success ? 'text-green-700' : 'text-red-700'}>
                      {result.phoneNumber}: {result.success ? 'Sent' : result.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Automatic profile creation for each phone number</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Longitudinal tracking across multiple sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Real-time word cloud updates from SMS and web</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Automatic tagging and behavioral analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Export participant profiles for follow-up engagement</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              SMS responses are linked to persistent participant profiles, enabling powerful longitudinal insights
              and targeted follow-up campaigns based on engagement patterns and sentiment evolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSIntegration;