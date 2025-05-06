
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export const CheckAdminStatus = () => {
  const { user, isAdmin } = useAuth();
  
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isAdmin ? "default" : "outline"} 
        className={isAdmin ? "bg-green-600 hover:bg-green-700" : "text-gray-400"}
      >
        {isAdmin ? 'Admin Access: Yes' : 'Admin Access: No'}
      </Badge>
      <span className="text-sm text-gray-400">{user?.email}</span>
    </div>
  );
};
