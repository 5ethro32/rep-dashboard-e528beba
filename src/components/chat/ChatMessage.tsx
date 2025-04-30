
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GradientAvatar, GradientAvatarFallback } from '@/components/ui/gradient-avatar';
import { BarChart, LineChart, PieChart, TrendingUp, TrendingDown, Flame, Award } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

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
  onExampleClick: (example: string) => void;
}

const ChatMessage = ({ message, onExampleClick }: ChatMessageProps) => {
  const renderChart = (message: Message) => {
    if (!message.chartData || !message.chartType) return null;
    
    return (
      <div className="mt-3 bg-gray-900 p-4 rounded-md border border-gray-700">
        <div className="flex items-center mb-2">
          {message.chartType === 'bar' && <BarChart className="h-5 w-5 mr-2 text-finance-red" />}
          {message.chartType === 'line' && <LineChart className="h-5 w-5 mr-2 text-finance-red" />}
          {message.chartType === 'pie' && <PieChart className="h-5 w-5 mr-2 text-finance-red" />}
          <span className="text-sm font-medium text-gray-200">{message.chartType === 'bar' ? 'Performance Chart' : message.chartType === 'line' ? 'Trend Analysis' : 'Distribution Chart'}</span>
        </div>
        <div className="h-40 w-full bg-gray-800/50 rounded flex items-center justify-center">
          <span className="text-xs text-gray-400">Interactive chart would render here based on the data</span>
        </div>
      </div>
    );
  };

  const renderTable = (message: Message) => {
    if (!message.tableData || !message.tableHeaders) return null;
    
    return (
      <div className="mt-3 overflow-x-auto">
        <Table className="min-w-full bg-gray-800 text-sm text-gray-200 rounded-md">
          <TableHeader>
            <TableRow className="border-b border-gray-600">
              {message.tableHeaders.map((header, i) => (
                <TableHead key={i} className="px-3 py-2 text-left font-medium text-gray-300">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {message.tableData.map((row, i) => (
              <TableRow key={i} className="border-b border-gray-700 hover:bg-gray-700/50">
                {Object.values(row).map((cell: any, j) => (
                  <TableCell key={j} className="px-3 py-2">{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderInsights = (insights?: string[]) => {
    if (!insights || insights.length === 0) return null;
    
    return (
      <div className="mt-3 bg-gray-900/70 p-3 rounded-md border border-gray-700">
        <div className="flex items-center mb-2">
          <Flame className="h-4 w-4 mr-2 text-amber-500" />
          <span className="text-sm font-medium text-gray-200">Key Insights</span>
        </div>
        <ul className="space-y-1.5 text-sm">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="text-amber-500/80 mr-2">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderTrends = (trends?: Message['trends']) => {
    if (!trends || trends.length === 0) return null;
    
    return (
      <div className="mt-3 bg-gray-900/70 p-3 rounded-md border border-gray-700">
        <div className="flex items-center mb-2">
          <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" />
          <span className="text-sm font-medium text-gray-200">Trends</span>
        </div>
        <div className="space-y-2">
          {trends.map((trend, index) => (
            <div key={index} className="flex items-center">
              {trend.type === 'up' && <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" />}
              {trend.type === 'down' && <TrendingDown className="h-4 w-4 mr-2 text-rose-500" />}
              {trend.type === 'neutral' && <span className="w-4 h-4 mr-2 inline-block text-center text-gray-400">→</span>}
              <div>
                <span className={`font-medium ${trend.type === 'up' ? 'text-emerald-500' : trend.type === 'down' ? 'text-rose-500' : 'text-gray-400'}`}>
                  {trend.value}
                </span>
                <span className="text-sm text-gray-400 ml-1">{trend.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHighlightedEntities = (entities?: Message['highlightedEntities']) => {
    if (!entities || entities.length === 0) return null;
    
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {entities.map((entity, index) => (
          <div key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-700">
            {entity.type === 'rep' && <Award className="h-3 w-3 mr-1 text-blue-400" />}
            {entity.type === 'customer' && <span className="mr-1 text-emerald-400">@</span>}
            {entity.type === 'department' && <span className="mr-1 text-amber-400">#</span>}
            {entity.type === 'metric' && <span className="mr-1 text-violet-400">$</span>}
            <span className="font-medium">{entity.name}:</span>
            <span className="ml-1">{entity.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!message.isUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-[80%]">
        <div 
          className={`rounded-lg p-3 ${
            message.isUser 
              ? 'bg-gradient-to-r from-finance-red to-rose-700 text-white' 
              : 'bg-gray-800 text-gray-100'
          } whitespace-pre-line`}
        >
          {message.content}
        </div>
        
        {/* Render highlighted entities if available */}
        {!message.isUser && renderHighlightedEntities(message.highlightedEntities)}
        
        {/* Render insights if available */}
        {!message.isUser && renderInsights(message.insights)}
        
        {/* Render trends if available */}
        {!message.isUser && renderTrends(message.trends)}
        
        {/* Render charts if available */}
        {!message.isUser && renderChart(message)}
        
        {/* Render tables if available */}
        {!message.isUser && renderTable(message)}
        
        {message.examples && message.examples.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.examples.map((example, index) => (
              <button
                key={index}
                onClick={() => onExampleClick(example)}
                className="px-3 py-1.5 text-sm bg-gray-700/50 hover:bg-gray-600 text-gray-300 rounded-full transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {message.isUser && (
        <GradientAvatar className="h-8 w-8 ml-2 flex-shrink-0 mt-1">
          <GradientAvatarFallback className="text-white text-xs">U</GradientAvatarFallback>
        </GradientAvatar>
      )}
    </div>
  );
};

export default ChatMessage;
