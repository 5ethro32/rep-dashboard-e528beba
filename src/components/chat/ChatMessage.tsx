
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

// Import charts if needed for visualizing data
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  examples?: string[];
  chartData?: any;
  chartType?: 'bar' | 'line' | 'pie';
  tableData?: any[];
  tableHeaders?: string[];
  insights?: string[];
  trends?: {
    type: 'up' | 'down' | 'neutral';
    value: string;
    description: string;
  }[];
  highlightedEntities?: {
    type: 'rep' | 'customer' | 'department' | 'metric';
    name: string;
    value: string;
  }[];
}

interface ChatMessageProps {
  message: Message;
  onExampleClick: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onExampleClick }) => {
  const renderChart = () => {
    if (!message.chartData) return null;
    
    return (
      <div className="mt-4 mb-2 bg-gray-800 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={message.chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#f43f5e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderTable = () => {
    if (!message.tableData || !message.tableHeaders) return null;
    
    return (
      <div className="mt-4 mb-2 overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr>
              {message.tableHeaders.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {message.tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                    {cell as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderTrends = () => {
    if (!message.trends || message.trends.length === 0) return null;
    
    return (
      <div className="mt-4 mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        {message.trends.map((trend, index) => (
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
  
  const renderHighlightedEntities = () => {
    if (!message.highlightedEntities || message.highlightedEntities.length === 0) return null;
    
    return (
      <div className="mt-4 mb-2 flex flex-wrap gap-2">
        {message.highlightedEntities.map((entity, index) => (
          <div 
            key={index} 
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              entity.type === 'rep' ? 'bg-blue-500/20 text-blue-300' : 
              entity.type === 'customer' ? 'bg-green-500/20 text-green-300' : 
              entity.type === 'department' ? 'bg-purple-500/20 text-purple-300' : 
              'bg-amber-500/20 text-amber-300'
            }`}
          >
            {entity.name}: {entity.value}
          </div>
        ))}
      </div>
    );
  };
  
  const renderInsights = () => {
    if (!message.insights || message.insights.length === 0) return null;
    
    return (
      <div className="mt-4 mb-2">
        <div className="font-medium text-sm text-gray-300 mb-2 flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          Key Insights
        </div>
        <div className="space-y-2">
          {message.insights.map((insight, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-2 text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 text-finance-red mt-0.5 flex-shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderExamples = () => {
    if (!message.examples || message.examples.length === 0) return null;
    
    return (
      <div className="mt-4 mb-2">
        <div className="flex gap-2 flex-wrap">
          {message.examples.map((example, index) => (
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
  
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      {!message.isUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[80%] rounded-lg p-4 ${
        message.isUser 
          ? 'bg-finance-red text-white' 
          : 'bg-gray-800 text-gray-100'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        {!message.isUser && (
          <>
            {renderChart()}
            {renderTable()}
            {renderTrends()}
            {renderHighlightedEntities()}
            {renderInsights()}
            {renderExamples()}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

