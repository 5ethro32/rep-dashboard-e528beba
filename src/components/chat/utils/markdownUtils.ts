
import React from 'react';

// Helper function to parse markdown bold text
export const parseMarkdownBold = (text: string): React.ReactNode[] => {
  if (!text.includes('**')) return [text];
  
  const segments = text.split('**');
  return segments.map((segment, index) => {
    // Even indices are regular text, odd indices should be bold
    return index % 2 === 0 
      ? segment 
      : <span key={index} className="font-bold">{segment}</span>;
  });
};
