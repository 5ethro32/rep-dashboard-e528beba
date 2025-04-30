
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Trend {
  type: 'up' | 'down' | 'neutral';
  value: string;
  description: string;
}

interface MessageTrendsProps {
  trends: Trend[];
}

const MessageTrends: React.FC<MessageTrendsProps> = ({ trends }) => {
  if (!trends || trends.length === 0) return null;
  
  return (
    <div className="mt-4 mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
      {trends.map((trend, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center">
          <div className="mr-3">
            {trend.type === 'up' && <ArrowUpRight className="text-green-500 h-5 w-5" />}
            {trend.type === 'down' && <ArrowDownRight className="text-rose-500 h-5 w-5" />}
            {trend.type === 'neutral' && <Minus className="text-gray-400 h-5 w-5" />}
          </div>
          <div>
            <div className="text-lg font-semibold">{trend.value}</div>
            <div className="text-xs text-gray-400">{trend.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageTrends;
