
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GradientAvatar, GradientAvatarFallback } from '@/components/ui/gradient-avatar';
import { BarChart, LineChart, PieChart } from 'lucide-react';
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
}

interface ChatMessageProps {
  message: Message;
  onExampleClick: (example: string) => void;
}

const ChatMessage = ({ message, onExampleClick }: ChatMessageProps) => {
  const renderChart = (message: Message) => {
    if (!message.chartData || !message.chartType) return null;
    
    return (
      <div className="mt-3 bg-gray-900 p-3 rounded-md border border-gray-700">
        {message.chartType === 'bar' && <BarChart className="h-6 w-6 mr-2" />}
        {message.chartType === 'line' && <LineChart className="h-6 w-6 mr-2" />}
        {message.chartType === 'pie' && <PieChart className="h-6 w-6 mr-2" />}
        <span className="text-xs text-gray-400">Charts would render here based on the data</span>
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
                <TableHead key={i} className="px-3 py-2 text-left">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {message.tableData.map((row, i) => (
              <TableRow key={i} className="border-b border-gray-700">
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

  return (
    <div 
      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!message.isUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-[75%]">
        <div 
          className={`rounded-lg p-3 ${
            message.isUser 
              ? 'bg-gradient-to-r from-finance-red to-rose-700 text-white' 
              : 'bg-gray-800 text-gray-100'
          } whitespace-pre-line`}
        >
          {message.content}
        </div>
        
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
