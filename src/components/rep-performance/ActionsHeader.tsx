
import React from 'react';
import { Database, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import { supabase } from "@/integrations/supabase/client";

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

  // Check if Supabase client is properly initialized
  const isSupabaseConnected = Boolean(supabase);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center text-sm">
        {isSupabaseConnected ? (
          <div className="flex items-center text-green-400">
            <Check className="h-4 w-4 mr-2" />
            <span>Connected to Supabase</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-300">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Supabase connection not available</span>
          </div>
        )}
      </div>
      <Button 
        variant="outline" 
        className="border-white/20 text-white hover:bg-white/10"
        onClick={handleConnectToDatabase}
        disabled={isLoading || !isSupabaseConnected}
      >
        {isLoading ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Database className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Loading Data..." : "Load Data from Supabase"}
      </Button>
    </div>
  );
};

export default ActionsHeader;
