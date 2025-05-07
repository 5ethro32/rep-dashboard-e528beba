
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';

const AppHeader = () => {
  const { user } = useAuth();
  
  // Determine the user's first name for the greeting
  let userFirstName = user?.email?.split('@')[0] || 'User';
  // Capitalize first letter
  userFirstName = userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-gray-950/80 border-b border-white/10">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/rep-performance" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="font-normal italic mr-1 text-transparent bg-clip-text bg-gradient-to-r from-finance-red to-rose-700">a</span>
            </span>
            {userFirstName && <span className="text-white/80 ml-2 hidden sm:inline-block">{userFirstName}</span>}
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
