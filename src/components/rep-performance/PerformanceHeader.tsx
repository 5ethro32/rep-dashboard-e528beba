
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  isLoading?: boolean;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  selectedMonth, 
  setSelectedMonth,
  isLoading 
}) => {
  return (
    <header className="py-8 md:py-16 px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
        Rep
        <br />
        Perform<span className="font-normal italic mr-1 -ml-0.5">a</span>nce
        <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">Dashboard</span>
      </h1>
      <div className="mt-4 md:mt-8 text-right">
        <Select
          value={selectedMonth}
          onValueChange={setSelectedMonth}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700 text-white focus:ring-finance-red focus:ring-opacity-50">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder={`${selectedMonth} 2025`} />
            )}
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white z-50">
            <SelectItem value="April" className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
              April 2025
            </SelectItem>
            <SelectItem value="March" className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
              March 2025
            </SelectItem>
            <SelectItem value="February" className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
              February 2025
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
};

export default PerformanceHeader;
