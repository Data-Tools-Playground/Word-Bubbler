'use client';

import React, { useState, useRef } from 'react';
import { parseFile, validateFile, ParsedData } from '@/utils/fileParser';

interface FileUploadProps {
  onDataLoad: (data: ParsedData) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad, disabled = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      const data = await parseFile(file);

      if (data.responses.length === 0) {
        setError('No valid text responses found in the file');
        return;
      }

      onDataLoad(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Upload Your Data
        </h3>
        <p className="text-sm text-gray-600">
          Upload a CSV, JSON, or TXT file with text responses to generate your word cloud
        </p>
      </div>

      {/* File Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={!disabled && !isProcessing ? handleClick : undefined}
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.txt,.tsv"
          onChange={handleFileSelect}
          disabled={disabled || isProcessing}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Processing file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV, JSON, and TXT files (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-700 text-sm font-medium">Error: {error}</p>
        </div>
      )}

      {/* File Format Examples */}
      <div className="mt-6 text-xs text-gray-500">
        <details>
          <summary className="cursor-pointer font-medium hover:text-gray-700">
            Supported file formats and examples
          </summary>
          <div className="mt-2 space-y-2">
            <div>
              <strong>CSV:</strong> Columns with headers like "response", "text", "comment", or "feedback"
            </div>
            <div>
              <strong>JSON:</strong> Array of objects with text fields or simple string array
            </div>
            <div>
              <strong>TXT:</strong> One response per line
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default FileUpload;