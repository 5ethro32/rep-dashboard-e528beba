
import React from 'react';
import { Lightbulb } from 'lucide-react';
import { parseMarkdownBold } from '../utils/markdownUtils';

interface MessageInsightsProps {
  insights: string[];
}

const MessageInsights: React.FC<MessageInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;
  
  return (
    <div className="mt-4 mb-2">
      <div className="font-medium text-sm text-gray-300 mb-2 flex items-center">
        <Lightbulb className="h-4 w-4 mr-1 text-amber-400" />
        Key Insights
      </div>
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div key={index} className="bg-gray-800/80 rounded-lg p-2 text-sm flex items-start">
            <div className="mr-2 p-1 rounded-full bg-blue-500/20 flex-shrink-0">
              <Lightbulb className="h-3 w-3 text-blue-300" />
            </div>
            <span className="text-gray-200">{parseMarkdownBold(insight)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageInsights;
