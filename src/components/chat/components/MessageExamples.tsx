
import React from 'react';

interface MessageExamplesProps {
  examples: string[];
  onExampleClick: (text: string) => void;
}

const MessageExamples: React.FC<MessageExamplesProps> = ({ examples, onExampleClick }) => {
  if (!examples || examples.length === 0) return null;
  
  return (
    <div className="mt-4 mb-2">
      <div className="flex gap-2 flex-wrap">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(example)}
            className="text-xs py-1 px-3 bg-gray-700/50 hover:bg-gray-600 text-gray-300 rounded-full transition-colors flex items-center gap-1"
          >
            <span>{example}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MessageExamples;
