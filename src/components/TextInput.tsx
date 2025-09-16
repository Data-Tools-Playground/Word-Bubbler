'use client';

import React, { useState } from 'react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  placeholder = "Enter your response...",
  disabled = false
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } catch (error) {
      console.error('Error submitting text:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="response-input" className="text-lg font-medium text-gray-700">
            Share your thoughts:
          </label>
          <textarea
            id="response-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
            maxLength={500}
          />
          <div className="text-sm text-gray-500 text-right">
            {text.length}/500 characters
          </div>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isSubmitting || disabled}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </button>
      </form>
    </div>
  );
};

export default TextInput;