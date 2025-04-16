
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="flex items-center">
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      <span className="text-sm text-finance-gray">Loading...</span>
    </div>
  );
};

export default LoadingState;
