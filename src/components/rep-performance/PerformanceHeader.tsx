
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  compareMonth?: string;
  setCompareMonth?: (value: string) => void;
  showCompareSelector?: boolean;
  hideTitle?: boolean;
  reducedPadding?: boolean;
  onRefresh?: () => void;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  selectedMonth, 
  setSelectedMonth,
  compareMonth,
  setCompareMonth,
  showCompareSelector = false,
  hideTitle = false,
  reducedPadding = false,
  onRefresh
}) => {
  // Determine if the selected month is the current month (May in this case)
  // In a production app, we'd use the actual current month logic
  const isCurrentMonth = selectedMonth === 'May';
  
  // Determine padding classes based on the reducedPadding prop
  const paddingClasses = reducedPadding 
    ? 'py-4'
    : 'py-8 md:py-16';
    
  return (
    <header className={`${hideTitle ? '' : paddingClasses} px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent ${hideTitle ? 'flex justify-end' : ''}`}>
      {!hideTitle && (
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
          Rep
          <br />
          Perform<span className="font-normal italic mr-1 -ml-0.5">a</span>nce
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">Dashboard</span>
        </h1>
      )}
      <div className={`${hideTitle ? '' : 'mt-4 md:mt-8 text-right'} flex items-center justify-end gap-2`}>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center text-lg md:text-xl lg:text-2xl text-white/80 hover:text-white transition-colors focus:outline-none">
            <Calendar className="h-4 w-4 mr-2 opacity-70" />
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
        
        {showCompareSelector && setCompareMonth && compareMonth && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-sm md:text-lg text-white/70 hover:text-white transition-colors focus:outline-none">
              <span className="text-white/50 mr-2">vs</span>
              {compareMonth === 'Prior MTD' ? compareMonth : `${compareMonth} 2025`}
              <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 z-50">
              {/* Only show Prior MTD option if we're viewing the current month */}
              {isCurrentMonth && (
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                  onClick={() => setCompareMonth('Prior MTD')}
                >
                  Prior MTD
                </DropdownMenuItem>
              )}
              
              {/* Don't allow comparing to the current month */}
              {selectedMonth !== 'May' && (
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                  onClick={() => setCompareMonth('May')}
                >
                  May 2025
                </DropdownMenuItem>
              )}
              
              {/* Don't allow comparing to the selected month */}
              {selectedMonth !== 'April' && (
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                  onClick={() => setCompareMonth('April')}
                >
                  April 2025
                </DropdownMenuItem>
              )}
              
              {/* Don't allow comparing to the selected month */}
              {selectedMonth !== 'March' && (
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                  onClick={() => setCompareMonth('March')}
                >
                  March 2025
                </DropdownMenuItem>
              )}
              
              {/* Don't allow comparing to the selected month */}
              {selectedMonth !== 'February' && (
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer" 
                  onClick={() => setCompareMonth('February')}
                >
                  February 2025
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default PerformanceHeader;
