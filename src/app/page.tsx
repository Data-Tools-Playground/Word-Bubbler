'use client';

import React, { useState, useEffect } from 'react';
import WordCloud from '@/components/WordCloud';
import TextInput from '@/components/TextInput';
import DemoData from '@/components/DemoData';
import { addTextToFrequencies, createWordCloudData, calculateWordFrequencies } from '@/utils/textProcessor';

interface WordFrequency {
  [word: string]: number;
}

export default function Home() {
  const [submissions, setSubmissions] = useState<string[]>([]);
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency>({});
  const [wordCloudData, setWordCloudData] = useState<Array<{text: string; size: number; frequency: number}>>([]);

  useEffect(() => {
    const data = createWordCloudData(wordFrequencies);
    setWordCloudData(data);
  }, [wordFrequencies]);

  const handleTextSubmission = async (text: string) => {
    // Add to submissions
    setSubmissions(prev => [...prev, text]);

    // Update word frequencies
    setWordFrequencies(prev => addTextToFrequencies(prev, text));
  };

  const handleLoadDemoData = (demoTexts: string[]) => {
    setSubmissions(demoTexts);
    setWordFrequencies(calculateWordFrequencies(demoTexts));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Word Bubble Poll
          </h1>
          <p className="text-lg text-gray-600">
            Share your thoughts and watch the word cloud evolve in real-time
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{submissions.length}</div>
            <div className="text-sm text-gray-500">Responses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {Object.keys(wordFrequencies).length}
            </div>
            <div className="text-sm text-gray-500">Unique Words</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Object.values(wordFrequencies).reduce((sum, freq) => sum + freq, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Words</div>
          </div>
        </div>

        {/* Demo Data */}
        <DemoData onLoadDemo={handleLoadDemoData} />

        {/* Text Input */}
        <div className="mb-8">
          <TextInput
            onSubmit={handleTextSubmission}
            placeholder="What are your thoughts on this topic? Share your ideas..."
          />
        </div>

        {/* Word Cloud */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Live Word Cloud
          </h2>
          {wordCloudData.length > 0 ? (
            <div className="flex justify-center">
              <WordCloud words={wordCloudData} width={1000} height={500} />
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <div className="text-6xl mb-4">💭</div>
              <p className="text-lg">No responses yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Responses ({submissions.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {submissions.slice(-10).reverse().map((submission, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded border-l-4 border-blue-500"
                >
                  &ldquo;{submission}&rdquo;
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
