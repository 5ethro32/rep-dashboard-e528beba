
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GradientAvatar, GradientAvatarFallback } from '@/components/ui/gradient-avatar';
import { cn } from '@/lib/utils';

type MessageType = 'text' | 'visual' | 'concise' | 'deep-research';

interface VeraMessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: MessageType;
}

const VeraMessage = ({ content, isUser, timestamp, type = 'text' }: VeraMessageProps) => {
  return (
    <div className={cn("flex w-full max-w-3xl", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 mr-3 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl p-4",
          isUser 
            ? "bg-gradient-to-r from-finance-red to-rose-700 text-white" 
            : "bg-gray-800 text-gray-100"
        )}>
          {content}
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {isUser && (
        <GradientAvatar className="h-8 w-8 ml-3 flex-shrink-0 mt-1">
          <GradientAvatarFallback className="text-white text-xs">U</GradientAvatarFallback>
        </GradientAvatar>
      )}
    </div>
  );
};

export default VeraMessage;
