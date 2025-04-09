
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ActionsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const ActionsHeader = ({ onRefresh, isLoading }: ActionsHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
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
    </div>
  );
};

export default ActionsHeader;
