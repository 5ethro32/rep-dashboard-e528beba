
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';

interface RefreshControlsProps {
  isLoading: boolean;
  onRefresh: () => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const RefreshControls = ({ 
  isLoading, 
  onRefresh, 
  selectedMonth, 
  setSelectedMonth 
}: RefreshControlsProps) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <Button 
        onClick={onRefresh} 
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="text-white border-white/20 hover:bg-white/10"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? "Refreshing..." : "Refresh Data"}
      </Button>
      
      <div className="flex-shrink-0">
        <PerformanceHeader 
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          hideTitle={true}
        />
      </div>
    </div>
  );
};

export default RefreshControls;
