
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useSelectedUser = () => {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // Initialize with current user when auth loads
  useEffect(() => {
    if (currentUser?.id && !selectedUserId) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser, selectedUserId]);

  const isCurrentUser = selectedUserId === currentUser?.id;
  
  return {
    selectedUserId,
    setSelectedUserId,
    currentUserId: currentUser?.id,
    isCurrentUser
  };
};
