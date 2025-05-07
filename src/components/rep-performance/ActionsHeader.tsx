
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActionsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshed?: boolean;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const ActionsHeader = ({ 
  onRefresh, 
  isLoading, 
  autoRefreshed,
  selectedMonth,
  setSelectedMonth
}: ActionsHeaderProps) => {
  return (
    <div className="flex justify-end items-center mb-6 gap-3">
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="w-[120px] text-white border-white/20 bg-transparent hover:bg-white/10">
          <SelectValue placeholder={selectedMonth} />
        </SelectTrigger>
        <SelectContent className="bg-finance-darkBg border-white/20">
          <SelectItem value="May">May</SelectItem>
          <SelectItem value="April">April</SelectItem>
          <SelectItem value="March">March</SelectItem>
          <SelectItem value="February">February</SelectItem>
        </SelectContent>
      </Select>
      
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
