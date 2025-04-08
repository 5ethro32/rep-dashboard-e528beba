
import React from 'react';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ActionsHeader: React.FC = () => {
  return (
    <div className="flex justify-end mb-4">
      <Button 
        variant="outline" 
        className="border-white/20 text-white hover:bg-white/10"
        disabled={true}  // This will be enabled once Supabase is integrated
        title="Supabase integration coming soon"
      >
        <Database className="mr-2 h-4 w-4" />
        Connect to Database
      </Button>
    </div>
  );
};

export default ActionsHeader;
