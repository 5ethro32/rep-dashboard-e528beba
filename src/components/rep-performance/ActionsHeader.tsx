
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
  return <div className="flex items-center mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="bg-gray-900/70 border border-gray-700 hover:bg-gray-800 text-white rounded-full w-10 h-10"
        aria-label="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
      
      {autoRefreshed && <span className="ml-2 text-sm text-white/60">
          Auto-refreshed
        </span>}
    </div>;
};

export default ActionsHeader;
