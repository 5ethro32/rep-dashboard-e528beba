
import React from 'react';
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
  const months = ['February', 'March', 'April', 'May'];
  
  const handleRefresh = () => {
    if (typeof window !== 'undefined' && window.repPerformanceRefresh) {
      window.repPerformanceRefresh();
    }
  };
  
  return (
    <div className="flex flex-wrap items-center justify-between w-full gap-3 mb-8">
      <div className="flex flex-wrap gap-3">
        <ToggleButton 
          checked={includeRetail} 
          onToggle={setIncludeRetail}
          className="min-w-[100px]"
        >
          Retail
        </ToggleButton>
        
        <ToggleButton 
          checked={includeReva} 
          onToggle={setIncludeReva}
          className="min-w-[100px]"
        >
          REVA
        </ToggleButton>
        
        <ToggleButton 
          checked={includeWholesale} 
          onToggle={setIncludeWholesale}
          className="min-w-[100px]"
        >
          Wholesale
        </ToggleButton>
      </div>
      
      {showMonthSelector && (
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
    </div>
  );
};

export default PerformanceFilters;
