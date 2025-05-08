
import React from 'react';
import { ToggleButton } from "@/components/ui/toggle-button";
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

interface PerformanceFiltersProps {
  includeRetail: boolean;
  setIncludeRetail: (value: boolean) => void;
  includeReva: boolean;
  setIncludeReva: (value: boolean) => void;
  includeWholesale: boolean;
  setIncludeWholesale: (value: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  includeRetail,
  setIncludeRetail,
  includeReva,
  setIncludeReva,
  includeWholesale,
  setIncludeWholesale,
  selectedMonth,
  setSelectedMonth
}) => {
  return (
    <div className="mb-6 md:mb-8 flex flex-row flex-wrap justify-between items-center gap-3">
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
      
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-gray-900/70 border border-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Month: {selectedMonth}
            </Button>
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
        
        <Button
          variant="outline"
          size="icon"
          className="bg-gray-900/70 border border-gray-700 hover:bg-gray-800 text-white rounded-full w-10 h-10"
          onClick={() => {
            // Call the global refresh handler if available
            if (window.repPerformanceRefresh) {
              window.repPerformanceRefresh();
            }
          }}
          aria-label="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PerformanceFilters;
