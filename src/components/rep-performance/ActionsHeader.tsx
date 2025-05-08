
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ActionsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshed?: boolean;
}

const ActionsHeader = ({ 
  onRefresh, 
  isLoading, 
  autoRefreshed
}: ActionsHeaderProps) => {
  return (
    <div className="flex items-center mb-6">
      <Button
        onClick={onRefresh}
        variant="outline"
        size="sm"
        className="text-white border-white/20 hover:bg-white/10"
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh Data'}
      </Button>
      {autoRefreshed && (
        <span className="ml-2 text-sm text-white/60">
          Auto-refreshed
        </span>
      )}
    </div>
  );
};

export default ActionsHeader;
