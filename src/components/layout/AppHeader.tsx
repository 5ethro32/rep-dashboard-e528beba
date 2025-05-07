
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';
import UserSelector from '@/components/rep-tracker/UserSelector';

interface AppHeaderProps {
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
  showUserSelector?: boolean;
}

const AppHeader = ({ selectedUserId, onSelectUser, showUserSelector = false }: AppHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Function to get the current page title based on the URL path
  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/rep-performance':
        return 'Performance Dashboard';
      case '/account-performance':
        return 'Account Performance';
      case '/rep-tracker':
        return 'Rep Tracker';
      case '/my-performance':
        return 'My Performance';
      case '/ai-vera':
        return 'AI Vera';
      default:
        return '';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-gray-950/80 border-b border-white/10">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/rep-performance" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="font-normal italic mr-1 text-transparent bg-clip-text bg-gradient-to-r from-finance-red to-rose-700">a</span>
            </span>
          </Link>
          <div className="flex items-center text-white/70">
            <span className="text-finance-red mx-1.5">/</span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {getCurrentPageTitle()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {showUserSelector && onSelectUser && (
            <UserSelector
              selectedUserId={selectedUserId || "all"}
              onSelectUser={onSelectUser}
              className="mr-2"
              showAllDataOption={true}
            />
          )}
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
