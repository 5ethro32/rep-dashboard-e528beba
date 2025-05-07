
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ActionsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshed?: boolean;
}

const ActionsHeader = ({ onRefresh, isLoading, autoRefreshed }: ActionsHeaderProps) => {
  return (
    <div className="flex items-center space-x-2">
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
      
      {autoRefreshed && (
        <span className="text-xs text-green-400">Data refreshed</span>
      )}
    </div>
  );
};

export default ActionsHeader;
