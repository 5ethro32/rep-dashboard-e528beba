
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const LoadingState = () => {
  return (
    <div className="flex flex-col w-full gap-2">
      <Skeleton className="h-7 w-1/2 mb-1" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-4 w-1/3 mt-1" />
    </div>
  );
};

export default LoadingState;
