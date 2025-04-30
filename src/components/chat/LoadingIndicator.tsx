
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const LoadingIndicator = () => {
  return (
    <div className="flex justify-start">
      <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
      </Avatar>
      <div className="bg-gray-800 text-gray-100 rounded-lg p-4">
        <div className="flex flex-col gap-2">
          <div className="flex space-x-2 items-center">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '600ms' }}></div>
          </div>
          <div className="text-xs text-gray-400">Analyzing sales data...</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
