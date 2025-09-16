'use client';

import React, { useState } from 'react';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';
import CreateSession from '@/components/CreateSession';
import JoinSession from '@/components/JoinSession';
import LiveSession from '@/components/LiveSession';
import FileUpload from '@/components/FileUpload';
import BulkTextInput from '@/components/BulkTextInput';
import DemoData from '@/components/DemoData';
import WordCloud from '@/components/WordCloud';
import { calculateWordFrequencies, createWordCloudData } from '@/utils/textProcessor';
import { ParsedData } from '@/utils/fileParser';

function HomeContent() {
  const { currentSession } = useSocket();
  const [mode, setMode] = useState<'live' | 'offline'>('live');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'demo'>('demo');

  // Offline mode state
  const [offlineResponses, setOfflineResponses] = useState<string[]>([]);
  const [wordCloudData, setWordCloudData] = useState<Array<{text: string; size: number; frequency: number}>>([]);

  const handleOfflineDataLoad = (responses: string[]) => {
    setOfflineResponses(responses);
    const frequencies = calculateWordFrequencies(responses);
    const data = createWordCloudData(frequencies);
    setWordCloudData(data);
  };

  const handleFileUpload = (data: ParsedData) => {
    handleOfflineDataLoad(data.responses);
  };

  const handleBulkTextSubmit = (responses: string[]) => {
    handleOfflineDataLoad(responses);
  };

  const handleLoadDemoData = (demoTexts: string[]) => {
    handleOfflineDataLoad(demoTexts);
  };

  // If in a live session, show the live interface
  if (currentSession) {
    return <LiveSession />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Word Bubbler 💭
          </h1>
          <p className="text-lg text-gray-600">
            Create live, collaborative word cloud polls or analyze existing data
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setMode('live')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                mode === 'live'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎯 Live Polling
            </button>
            <button
              onClick={() => setMode('offline')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                mode === 'offline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Data Analysis
            </button>
          </div>
        </div>

        {mode === 'live' ? (
          /* Live Polling Mode */
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <CreateSession />
              <JoinSession />
            </div>

            <div className="text-center">
              <div className="inline-block bg-blue-50 rounded-lg p-6 max-w-2xl">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  🚀 Real-time Collaboration
                </h3>
                <p className="text-blue-700 text-sm">
                  Create a session and share the ID with participants. Watch the word cloud grow
                  in real-time as responses pour in from multiple users simultaneously.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Offline Data Analysis Mode */
          <div className="space-y-8">
            {/* Data Input Options */}
            {offlineResponses.length === 0 && (
              <div className="mb-8">
                {/* Tab Navigation */}
                <div className="flex justify-center mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                      <button
                        onClick={() => setActiveTab('demo')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'demo'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        🎯 Try Demo
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'upload'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        📁 Upload File
                      </button>
                      <button
                        onClick={() => setActiveTab('paste')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'paste'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        📝 Paste Text
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="mb-8">
                  {activeTab === 'demo' && (
                    <DemoData onLoadDemo={handleLoadDemoData} />
                  )}

                  {activeTab === 'upload' && (
                    <FileUpload onDataLoad={handleFileUpload} />
                  )}

                  {activeTab === 'paste' && (
                    <BulkTextInput onDataSubmit={handleBulkTextSubmit} />
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            {offlineResponses.length > 0 && (
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{offlineResponses.length}</div>
                  <div className="text-sm text-gray-500">Responses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{wordCloudData.length}</div>
                  <div className="text-sm text-gray-500">Unique Words</div>
                </div>
                <button
                  onClick={() => {
                    setOfflineResponses([]);
                    setWordCloudData([]);
                  }}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Clear Data
                </button>
              </div>
            )}

            {/* Word Cloud */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Word Cloud Visualization
              </h2>
              {wordCloudData.length > 0 ? (
                <div className="flex justify-center">
                  <WordCloud words={wordCloudData} width={1000} height={500} />
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg mb-4">Ready to analyze your data!</p>
                  <p className="text-sm">Try the demo, upload a file, or paste your text responses</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SocketProvider>
      <HomeContent />
    </SocketProvider>
  );
}
