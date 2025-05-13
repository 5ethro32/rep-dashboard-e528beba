
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  hideTitle?: boolean;
  reducedPadding?: boolean; // For reduced padding
  onRefresh?: () => void;  // Keep the prop for functionality but don't use it in UI
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  selectedMonth, 
  setSelectedMonth,
  hideTitle = false,
  reducedPadding = false,
  onRefresh
}) => {
  const isMobile = useIsMobile();
  
  // Determine padding classes based on the reducedPadding prop
  const paddingClasses = reducedPadding 
    ? 'py-4' // More balanced padding for top and bottom
    : 'py-8 md:py-16'; // Original padding
    
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
      <div className={`${hideTitle ? '' : 'mt-4 md:mt-8 text-right'} flex items-center justify-end gap-2 z-40`}>
        {/* Add separate refresh button */}
        {onRefresh && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh} 
            className="px-3 py-2 rounded-md border border-gray-700 bg-gray-900/70 text-white hover:bg-gray-800 transition-colors focus:outline-none h-9 w-9"
          >
            <RefreshCw className="h-4 w-4 opacity-70" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 bg-gray-900/70 text-white hover:bg-gray-800 transition-colors focus:outline-none">
            <CalendarIcon className="h-4 w-4 opacity-70" />
            {isMobile ? (
              <span>{selectedMonth}</span>
            ) : (
              <span>Month: {selectedMonth}</span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-950/95 backdrop-blur-sm border border-white/5 z-50">
            <DropdownMenuItem 
              className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
              onClick={() => setSelectedMonth('May')}
            >
              May 2025
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
              onClick={() => setSelectedMonth('April')}
            >
              April 2025
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
              onClick={() => setSelectedMonth('March')}
            >
              March 2025
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
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
