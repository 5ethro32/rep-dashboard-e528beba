
import React from 'react';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
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

  // Check if Supabase environment variables are set
  const isMissingSupabaseConfig = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className="flex justify-end mb-4">
      {isMissingSupabaseConfig && (
        <div className="mr-auto flex items-center text-sm text-amber-300">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</span>
        </div>
      )}
      <Button 
        variant="outline" 
        className="border-white/20 text-white hover:bg-white/10"
        onClick={handleConnectToDatabase}
        disabled={isLoading || isMissingSupabaseConfig}
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
