
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
        disabled={isLoading}
        className="bg-gray-900/50 border-white/10 text-white/80"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
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
