
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';
import UserSelector from '@/components/rep-tracker/UserSelector';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  hideTitle?: boolean;
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  selectedMonth, 
  setSelectedMonth,
  hideTitle = false,
  selectedUserId = null,
  onSelectUser
}) => {
  return (
    <header className={`py-8 md:py-16 px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent ${hideTitle ? 'flex justify-end' : ''}`}>
      {!hideTitle && (
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
          Rep
          <br />
          Perform<span className="font-normal italic mr-1 -ml-0.5">a</span>nce
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">Dashboard</span>
        </h1>
      )}
      <div className={`${hideTitle ? '' : 'mt-4 md:mt-8'} flex justify-end items-center gap-4`}>
        {onSelectUser && (
          <div className="mr-4">
            <UserSelector 
              selectedUserId={selectedUserId}
              onSelectUser={onSelectUser}
              showAllDataOption={true}
            />
          </div>
        )}
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-lg md:text-xl lg:text-2xl text-white/80 hover:text-white transition-colors focus:outline-none">
              {selectedMonth} 2025
              <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 z-50">
              <DropdownMenuItem 
                className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                onClick={() => setSelectedMonth('May')}
              >
                May 2025
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                onClick={() => setSelectedMonth('April')}
              >
                April 2025
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                onClick={() => setSelectedMonth('March')}
              >
                March 2025
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                onClick={() => setSelectedMonth('February')}
              >
                February 2025
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default PerformanceHeader;
