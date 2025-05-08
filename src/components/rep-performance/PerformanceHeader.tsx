
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
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceHeaderProps {
  hideTitle?: boolean;
  reducedPadding?: boolean;
  selectedMonth?: string;
  setSelectedMonth?: (value: string) => void;
  onRefresh?: () => void;
  showMonthSelector?: boolean;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  hideTitle = false,
  reducedPadding = false,
  selectedMonth,
  setSelectedMonth,
  onRefresh,
  showMonthSelector = true
}) => {
  // Determine padding classes based on the reducedPadding prop
  const paddingClasses = reducedPadding 
    ? 'py-4' 
    : 'py-8 md:py-16';
  
  // Ensure months is always a valid array
  const months = ['February', 'March', 'April', 'May'];
  const isMobile = useIsMobile();
  
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
      {selectedMonth && setSelectedMonth && showMonthSelector && (
        <div className="flex items-center gap-2 ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`bg-gray-900/40 backdrop-blur-sm border-white/10 text-white hover:bg-gray-800/40 ${isMobile ? 'px-2 py-1 h-8 text-xs' : ''}`}
              >
                <Calendar className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                <span>{isMobile ? selectedMonth : `Month: ${selectedMonth}`}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0 bg-gray-900/95 backdrop-blur-sm border-white/10" align="end">
              <Command className="bg-transparent">
                <CommandInput placeholder="Select month..." className="text-white" />
                <CommandEmpty>No month found.</CommandEmpty>
                <CommandGroup className="overflow-hidden">
                  {Array.isArray(months) && months.map((month) => (
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
            size={isMobile ? "sm" : "icon"}
            onClick={handleRefresh}
            className={`bg-gray-900/40 backdrop-blur-sm border-white/10 text-white hover:bg-gray-800/40 ${isMobile ? 'w-8 h-8 p-1' : ''}`}
          >
            <RefreshCw className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </Button>
        </div>
      )}
    </header>
  );
};

export default PerformanceHeader;
