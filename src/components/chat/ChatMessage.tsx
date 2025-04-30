
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles
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
  aiAnalysisUsed?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onExampleClick: (text: string) => void;
}

// Helper function to parse markdown bold text
const parseMarkdownBold = (text: string): React.ReactNode[] => {
  if (!text.includes('**')) return [text];
  
  const segments = text.split('**');
  return segments.map((segment, index) => {
    // Even indices are regular text, odd indices should be bold
    return index % 2 === 0 
      ? segment 
      : <span key={index} className="font-bold">{segment}</span>;
  });
};

// Format currency values with £ symbol and k/m suffixes
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  } else if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  } else {
    return `£${value}`;
  }
};

// Helper function to improve insight text and content
const improveInsightText = (text: string): string => {
  // Case 1: Remove or replace misleading "serves X profitable customers" insights
  if (text.includes('serves') && text.includes('profitable customers')) {
    // We want to completely remove this insight as it's misleading
    return ""; // Return empty string to filter it out later
  }
  
  // Case 2: Make sure average profit explicitly mentions "top 10 customers"
  if (text.includes('average profit per customer is')) {
    const repNameMatch = text.match(/(.*?)'s/);
    const repName = repNameMatch ? repNameMatch[1] : 'The rep';
    
    const profitMatch = text.match(/average profit per customer is (£[\d,.]+)/);
    if (profitMatch) {
      return `${repName}'s top 10 customers have an average profit of ${profitMatch[1]}`;
    }
  }
  
  // Case 3: Add "top 10" specification to the total profit text
  if (text.includes('total profit') && !text.includes('top 10')) {
    return text.replace('total profit', 'total profit across top 10 customers');
  }
  
  return text;
};

// Enhanced function to also modify main content text
const enhanceContentText = (text: string): string => {
  // Add "top 10" specification to relevant phrases in the main content
  if (text.includes('top customers by profit') && !text.includes('top 10')) {
    text = text.replace('top customers by profit', 'top 10 customers by profit');
  }
  
  // Fix any mentions of total profit without context
  if (text.includes('Total Profit:') && !text.includes('top 10')) {
    text = text.replace('Total Profit:', 'Total Profit (top 10 customers):');
  }
  
  return text;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onExampleClick }) => {
  // Process message content first to enhance main text
  const enhancedContent = typeof message.content === 'string' 
    ? enhanceContentText(message.content)
    : message.content;
  
  const renderChart = () => {
    if (!message.chartData) return null;
    
    return (
      <div className="mt-4 mb-2 bg-gray-800 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={message.chartData}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
            />
            <YAxis 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
              width={60}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              labelFormatter={(label) => `${label}`}
              contentStyle={{ 
                backgroundColor: '#1A1F2C', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '10px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 500,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}
            />
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
        {message.trends.map((trend, index) => {
          // Enhance trend descriptions to clarify context for profit values
          let enhancedDescription = trend.description;
          if (trend.description.toLowerCase().includes('profit') && !trend.description.includes('top 10')) {
            enhancedDescription = trend.description.replace('profit', 'profit (top 10 customers)');
          }
          
          return (
            <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center">
              <div className="mr-3">
                {trend.type === 'up' && <ArrowUpRight className="text-green-500 h-5 w-5" />}
                {trend.type === 'down' && <ArrowDownRight className="text-rose-500 h-5 w-5" />}
                {trend.type === 'neutral' && <Minus className="text-gray-400 h-5 w-5" />}
              </div>
              <div>
                <div className="text-lg font-semibold">{trend.value}</div>
                <div className="text-xs text-gray-400">{enhancedDescription}</div>
              </div>
            </div>
          );
        })}
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
    
    // Filter out any empty insights (like those we marked for removal)
    const filteredInsights = message.insights
      .map(insight => improveInsightText(insight))
      .filter(insight => insight.length > 0);
    
    if (filteredInsights.length === 0) return null;
    
    return (
      <div className="mt-4 mb-2">
        <div className="font-medium text-sm text-gray-300 mb-2 flex items-center">
          <Lightbulb className="h-4 w-4 mr-1 text-amber-400" />
          Key Insights
        </div>
        <div className="space-y-2">
          {filteredInsights.map((insight, index) => (
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

  // Render examples as clickable buttons - this will only be used for the initial welcome message
  const renderExamples = () => {
    // Only render examples for the initial welcome message (id = '1')
    if (!message.examples || message.examples.length === 0 || message.id !== '1') return null;
    
    return (
      <div className="mt-4">
        <div className="text-sm text-gray-400 mb-2">Try asking:</div>
        <div className="flex flex-wrap gap-2">
          {message.examples.map((example, index) => (
            <button
              key={index}
              onClick={() => onExampleClick(example)}
              className="text-xs py-1 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
            >
              {example}
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
          <AvatarFallback className="bg-gradient-to-r from-finance-red to-finance-red/80 text-white text-xs">V</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[80%] rounded-lg p-4 ${
        message.isUser 
          ? 'bg-finance-red text-white' 
          : 'bg-gray-800 text-gray-100'
      }`}>
        {!message.isUser && message.aiAnalysisUsed && (
          <div className="flex items-center gap-1 mb-2 text-xs text-amber-300/70">
            <Sparkles className="h-3 w-3" />
            <span>AI Analysis</span>
          </div>
        )}
        <div className="whitespace-pre-wrap">
          {typeof enhancedContent === 'string' ? parseMarkdownBold(enhancedContent) : enhancedContent}
        </div>
        
        {!message.isUser && (
          <>
            {/* Reordered to show highlighted entities and trends first, then insights, then charts */}
            {renderHighlightedEntities()}
            {renderTrends()}
            {renderInsights()}
            {renderChart()}
            {renderTable()}
            {renderExamples()}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
