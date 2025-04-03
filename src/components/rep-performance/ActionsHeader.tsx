
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ActionsHeader: React.FC = () => {
  return (
    <div className="flex justify-end mb-4">
      <Link to="/data-upload">
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Upload className="mr-2 h-4 w-4" />
          Upload Data
        </Button>
      </Link>
    </div>
  );
};

export default ActionsHeader;
