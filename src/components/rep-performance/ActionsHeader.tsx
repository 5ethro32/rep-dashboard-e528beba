
import React from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';

const ActionsHeader: React.FC = () => {
  const { toast } = useToast();
  const { loadDataFromSupabase, isLoading } = useRepPerformanceData();

  const handleConnectToDatabase = async () => {
    try {
      await loadDataFromSupabase();
      toast({
        title: "Data loaded successfully",
        description: "The latest data has been loaded from Supabase.",
      });
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-end mb-4">
      <Button 
        variant="outline" 
        className="border-white/20 text-white hover:bg-white/10"
        onClick={handleConnectToDatabase}
        disabled={isLoading}
      >
        {isLoading ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Database className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Loading Data..." : "Refresh from Database"}
      </Button>
    </div>
  );
};

export default ActionsHeader;
