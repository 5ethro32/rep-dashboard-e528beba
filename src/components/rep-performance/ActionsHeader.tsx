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
      
      {autoRefreshed && <span className="ml-2 text-sm text-white/60">
          Auto-refreshed
        </span>}
    </div>;
};
export default ActionsHeader;