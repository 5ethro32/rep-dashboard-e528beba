
import React, { useMemo } from 'react';
import { ToggleButton } from "@/components/ui/toggle-button";
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

interface PerformanceFiltersProps {
  includeRetail: boolean;
  setIncludeRetail: (value: boolean) => void;
  includeReva: boolean;
  setIncludeReva: (value: boolean) => void;
  includeWholesale: boolean;
  setIncludeWholesale: (value: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  showMonthSelector?: boolean;
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  includeRetail,
  setIncludeRetail,
  includeReva,
  setIncludeReva,
  includeWholesale,
  setIncludeWholesale,
  selectedMonth,
  setSelectedMonth,
  showMonthSelector = true
}) => {
  // Ensure months is always a valid array
  const months = useMemo(() => ['February', 'March', 'April', 'May'], []);
  const isMobile = useIsMobile();
  
  const handleRefresh = () => {
    if (typeof window !== 'undefined' && window.repPerformanceRefresh) {
      window.repPerformanceRefresh();
    }
  };
  
  // Determine button sizes based on screen size
  const toggleClassName = isMobile 
    ? 'min-w-[55px] px-2 py-1 text-xs'
    : 'min-w-[70px] px-3';
  
  return (
    <div className="flex items-center justify-between w-full gap-2 mb-6">
      <div className="flex gap-2 flex-grow">
        <ToggleButton 
          checked={includeRetail} 
          onToggle={setIncludeRetail}
          className={toggleClassName}
        >
          Retail
        </ToggleButton>
        
        <ToggleButton 
          checked={includeReva} 
          onToggle={setIncludeReva}
          className={toggleClassName}
        >
          REVA
        </ToggleButton>
        
        <ToggleButton 
          checked={includeWholesale} 
          onToggle={setIncludeWholesale}
          className={toggleClassName}
        >
          Wholesale
        </ToggleButton>
      </div>
      
      {showMonthSelector && (
        <div className="flex items-center gap-2 ml-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`bg-gray-900/40 backdrop-blur-sm border-white/10 text-white hover:bg-gray-800/40 ${isMobile ? 'px-2 py-1 h-8 text-xs' : ''}`}
              >
                <Calendar className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                <span>{selectedMonth}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0 bg-gray-900/95 backdrop-blur-sm border-white/10" align="end">
              <Command className="bg-transparent">
                <CommandInput placeholder="Select month..." className="text-white" />
                <CommandEmpty>No month found.</CommandEmpty>
                <CommandGroup className="overflow-hidden">
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
            size={isMobile ? "sm" : "icon"}
            onClick={handleRefresh}
            className={`bg-gray-900/40 backdrop-blur-sm border-white/10 text-white hover:bg-gray-800/40 ${isMobile ? 'w-8 h-8 p-1' : ''}`}
          >
            <RefreshCw className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PerformanceFilters;
