
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ selectedMonth, setSelectedMonth }) => {
  return (
    <header className="py-8 md:py-16 px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
        Rep
        <br />
        Perform<span className="font-normal italic">a</span>nce
        <br />
        <span className="red-gradient-text">Dashboard</span>
      </h1>
      <div className="mt-4 md:mt-8 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center text-lg md:text-xl lg:text-2xl text-white/80 hover:text-white transition-colors focus:outline-none">
            {selectedMonth} 2025
            <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700">
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
    </header>
  );
};

export default PerformanceHeader;
