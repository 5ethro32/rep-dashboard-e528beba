
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ActionsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const ActionsHeader: React.FC<ActionsHeaderProps> = ({ 
  onRefresh, 
  isLoading 
}) => {
  return (
    <div className="flex items-center">
      <Button
        onClick={onRefresh}
        variant="default"
        size="sm"
        className="bg-finance-red hover:bg-finance-red/80 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </>
        )}
      </Button>
      <span className="ml-3 text-xs text-gray-400">
        Note: Data retrieval is not limited to 1000 records
      </span>
    </div>
  );
};

export default ActionsHeader;
