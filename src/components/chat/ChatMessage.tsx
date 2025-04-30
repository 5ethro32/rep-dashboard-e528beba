
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatMessageProps } from './types';

// Import smaller component parts
import MessageContent from './components/MessageContent';
import MessageChart from './components/MessageChart';
import MessageTable from './components/MessageTable';
import MessageTrends from './components/MessageTrends';
import MessageHighlightedEntities from './components/MessageHighlightedEntities';
import MessageInsights from './components/MessageInsights';
import MessageExamples from './components/MessageExamples';

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onExampleClick }) => {
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
        <MessageContent content={message.content} />
        
        {!message.isUser && (
          <>
            <MessageChart chartData={message.chartData} />
            <MessageTable tableData={message.tableData} tableHeaders={message.tableHeaders} />
            <MessageTrends trends={message.trends || []} />
            <MessageHighlightedEntities entities={message.highlightedEntities || []} />
            <MessageInsights insights={message.insights || []} />
            <MessageExamples examples={message.examples || []} onExampleClick={onExampleClick} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
