import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Database } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

interface ActionsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const ActionsHeader: React.FC<ActionsHeaderProps> = ({ 
  onRefresh, 
  isLoading 
}) => {
  const showDataCounts = async () => {
    try {
      // Fetch counts directly from the tables
      const { count: mtdCount, error: mtdError } = await supabase
        .from('mtd_daily')
        .select('*', { count: 'exact', head: true });
        
      const { count: marchCount, error: marchError } = await supabase
        .from('march_rolling')
        .select('*', { count: 'exact', head: true });
        
      if (mtdError || marchError) {
        throw new Error('Error fetching counts');
      }
      
      toast({
        title: "Data Row Counts",
        description: `April MTD table: ${mtdCount || 0} rows\nMarch Rolling table: ${marchCount || 0} rows`,
        duration: 10000,
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data counts",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
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
      
      <Button
        onClick={showDataCounts}
        variant="outline"
        size="sm"
        className="border-finance-red text-finance-red hover:bg-finance-red/10"
      >
        <Database className="mr-2 h-4 w-4" />
        Show Row Counts
      </Button>
    </div>
  );
};

export default ActionsHeader;
