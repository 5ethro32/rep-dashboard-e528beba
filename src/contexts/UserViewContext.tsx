
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

interface UserViewContextType {
  viewingUserId: string;
  viewingUserName: string;
  isViewingOtherUser: boolean;
  setViewingUser: (userId: string, userName: string) => void;
}

const UserViewContext = createContext<UserViewContextType | undefined>(undefined);

export const UserViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [viewingUserId, setViewingUserId] = useState<string>(user?.id || '');
  const [viewingUserName, setViewingUserName] = useState<string>('');
  
  const isViewingOtherUser = user?.id !== viewingUserId;
  
  const setViewingUser = (userId: string, userName: string) => {
    if (!isAdmin && userId !== user?.id) {
      // Non-admins can only view their own data
      return;
    }
    
    setViewingUserId(userId);
    setViewingUserName(userName);
  };
  
  // Always reset to current user if auth state changes
  React.useEffect(() => {
    if (user) {
      setViewingUserId(user.id);
      setViewingUserName('');
    }
  }, [user]);

  return (
    <UserViewContext.Provider value={{
      viewingUserId,
      viewingUserName,
      isViewingOtherUser,
      setViewingUser
    }}>
      {children}
    </UserViewContext.Provider>
  );
};

export const useUserView = () => {
  const context = useContext(UserViewContext);
  if (context === undefined) {
    throw new Error('useUserView must be used within a UserViewProvider');
  }
  return context;
};
