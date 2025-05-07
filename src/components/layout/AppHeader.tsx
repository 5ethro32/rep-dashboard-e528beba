
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';
import UserSelector from '@/components/rep-tracker/UserSelector';

interface AppHeaderProps {
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
}

const AppHeader = ({ selectedUserId, onSelectUser }: AppHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAccountPerformancePage = location.pathname === '/account-performance';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-gray-950/80 border-b border-white/10">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/rep-performance" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="font-normal italic mr-1 text-transparent bg-clip-text bg-gradient-to-r from-finance-red to-rose-700">a</span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {isAccountPerformancePage && selectedUserId && onSelectUser && (
            <UserSelector
              selectedUserId={selectedUserId}
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
