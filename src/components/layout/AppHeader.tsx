
import React from 'react';
import Logo from '@/components/layout/Logo';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';

const AppHeader: React.FC = () => {
  const { user } = useAuth();
  
  // Determine the user's first name for the header
  let userFirstName = user?.email?.split('@')[0] || 'User';
  // Capitalize first letter
  userFirstName = userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/40 backdrop-blur-sm bg-black/30 flex items-center h-14">
      <div className="container max-w-full px-4 md:px-6 flex items-center justify-between">
        {/* Logo and username */}
        <div className="flex items-center space-x-3">
          <Logo className="mr-2" />
          <span className="font-medium text-sm text-white/80">{userFirstName}</span>
        </div>
        
        {/* Profile dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
