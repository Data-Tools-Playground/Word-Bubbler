'use client';

import React, { useState } from 'react';

interface BulkTextInputProps {
  onDataSubmit: (responses: string[]) => void;
  disabled?: boolean;
}

const BulkTextInput: React.FC<BulkTextInputProps> = ({ onDataSubmit, disabled = false }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // Split by lines and clean up
      const responses = text
        .split(/[\n\r]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (responses.length === 0) {
        alert('Please enter at least one response');
        return;
      }

      onDataSubmit(responses);
      setText(''); // Clear the text area after successful submission
    } catch (error) {
      console.error('Error processing text:', error);
      alert('Error processing text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setText('');
  };

  const lineCount = text.split(/[\n\r]+/).filter(line => line.trim().length > 0).length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Paste Text Responses
        </h3>
        <p className="text-sm text-gray-600">
          Paste your text responses below, one per line
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste your responses here, one per line:

Example:
I love the innovative features and user experience
Privacy and security are my main concerns
The benefits outweigh the potential risks
Cost effectiveness is crucial for adoption`}
            disabled={disabled || isProcessing}
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            maxLength={50000}
          />

          {/* Character/Line Counter */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
            {lineCount} responses • {text.length}/50,000 chars
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!text.trim() || isProcessing || disabled}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : `Generate Word Cloud (${lineCount} responses)`}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!text.trim() || isProcessing || disabled}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Tips:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Each line will be treated as a separate response</li>
          <li>• Empty lines will be ignored</li>
          <li>• Common words (the, and, is, etc.) are automatically filtered</li>
          <li>• Longer responses provide richer word clouds</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkTextInput;