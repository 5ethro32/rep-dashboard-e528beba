
import React from 'react';
import { ToggleButton } from "@/components/ui/toggle-button";
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from "@/components/ui/button";
import { RefreshCw, CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

interface PerformanceFiltersProps {
  includeRetail: boolean;
  setIncludeRetail: (value: boolean) => void;
  includeReva: boolean;
  setIncludeReva: (value: boolean) => void;
  includeWholesale: boolean;
  setIncludeWholesale: (value: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
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
  onRefresh,
  isLoading = false
}) => {
  const isMobile = useIsMobile();
  
  // Set smaller width on mobile
  const buttonClasses = isMobile 
    ? "min-w-[65px] px-2" 
    : "min-w-[80px] px-3";
  
  return (
    <div className="mb-6 md:mb-8 flex flex-row justify-between items-center">
      {/* Left side - toggle filters */}
      <div className="flex flex-row gap-2">
        <ToggleButton 
          checked={includeRetail} 
          onToggle={setIncludeRetail}
          className={buttonClasses}
        >
          Retail
        </ToggleButton>
        
        <ToggleButton 
          checked={includeReva} 
          onToggle={setIncludeReva}
          className={buttonClasses}
        >
          REVA
        </ToggleButton>
        
        <ToggleButton 
          checked={includeWholesale} 
          onToggle={setIncludeWholesale}
          className={buttonClasses}
        >
          Wholesale
        </ToggleButton>
      </div>
      
      {/* Right side - refresh button and month selector */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh} 
            disabled={isLoading}
            className="px-3 rounded-md border border-gray-700 bg-gray-900/70 text-white hover:bg-gray-800 transition-colors focus:outline-none h-9"
          >
            <RefreshCw className={`h-4 w-4 opacity-70 ${isLoading ? 'animate-spin' : ''}`} />
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
    </div>
  );
};

export default PerformanceFilters;
