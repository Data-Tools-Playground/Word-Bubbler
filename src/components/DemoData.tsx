'use client';

import React from 'react';

interface DemoDataProps {
  onLoadDemo: (texts: string[]) => void;
}

const DEMO_RESPONSES = [
  "I love the innovative features and user-friendly design",
  "Privacy concerns are my biggest worry about this technology",
  "The benefits outweigh the risks in my opinion",
  "Cost effectiveness is crucial for widespread adoption",
  "Security and data protection should be the top priority",
  "Innovation drives progress but we need proper regulation",
  "User experience matters more than advanced features",
  "Environmental impact should be considered in development",
  "Accessibility features are essential for inclusive design",
  "Performance optimization can improve user satisfaction",
  "Collaboration tools enhance productivity significantly",
  "Quality assurance ensures reliable software delivery",
  "Machine learning capabilities open new possibilities",
  "Open source development promotes transparency and trust",
  "Mobile optimization is necessary for modern applications"
];

const DemoData: React.FC<DemoDataProps> = ({ onLoadDemo }) => {
  const handleLoadDemo = () => {
    onLoadDemo(DEMO_RESPONSES);
  };

  return (
    <div className="text-center mb-6">
      <button
        onClick={handleLoadDemo}
        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
      >
        Load Demo Data
      </button>
      <p className="text-sm text-gray-500 mt-2">
        Click to populate with sample responses and see the word cloud in action
      </p>
    </div>
  );
};

export default DemoData;