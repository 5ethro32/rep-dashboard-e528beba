
import React from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface PerformanceHeaderProps {
  hideTitle?: boolean;
  reducedPadding?: boolean; // For reduced padding
  selectedMonth?: string;
  setSelectedMonth?: (value: string) => void;
  onRefresh?: () => void;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  hideTitle = false,
  reducedPadding = false,
  selectedMonth,
  setSelectedMonth,
  onRefresh
}) => {
  // Determine padding classes based on the reducedPadding prop
  const paddingClasses = reducedPadding 
    ? 'py-4' // More balanced padding for top and bottom
    : 'py-8 md:py-16'; // Original padding
  
  const months = ['February', 'March', 'April', 'May'];
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else if (typeof window !== 'undefined') {
      // @ts-ignore - Call global refresh function
      if (window.accountPerformanceRefresh) window.accountPerformanceRefresh();
    }
  };
    
  return (
    <header className={`${hideTitle ? '' : paddingClasses} px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent ${hideTitle ? 'flex justify-between items-center' : ''}`}>
      {!hideTitle && (
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
          Rep
          <br />
          Perform<span className="font-normal italic mr-1 -ml-0.5">a</span>nce
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">Dashboard</span>
        </h1>
      )}
      
      {/* Month selector and refresh button */}
      {selectedMonth && setSelectedMonth && (
        <div className="flex items-center gap-2 ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white hover:bg-gray-800/40"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Month: {selectedMonth}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0 bg-gray-900/90 backdrop-blur-sm border-white/10">
              <Command className="bg-transparent">
                <CommandInput placeholder="Select month..." className="text-white" />
                <CommandEmpty>No month found.</CommandEmpty>
                <CommandGroup>
                  {months.map((month) => (
                    <CommandItem
                      key={month}
                      value={month}
                      onSelect={(value) => {
                        setSelectedMonth(value);
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      {month}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white hover:bg-gray-800/40"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </header>
  );
};

export default PerformanceHeader;
