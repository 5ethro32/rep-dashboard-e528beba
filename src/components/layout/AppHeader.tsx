
import React from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';
import UserSelector from '@/components/rep-tracker/UserSelector';
import { BarChart3, ChartLine, ClipboardList, UserCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppHeaderProps {
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
  showUserSelector?: boolean;
}

const AppHeader = ({ selectedUserId, onSelectUser, showUserSelector = false }: AppHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
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
  
  const handleUserSelection = (userId: string | null, displayName: string) => {
    console.log(`AppHeader: User selection changed to ${displayName} (${userId})`);
    if (onSelectUser) {
      onSelectUser(userId, displayName);
    }
  };

  return (
    <>
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
            {showUserSelector && (
              <UserSelector
                selectedUserId={selectedUserId || "all"}
                onSelectUser={handleUserSelection}
                className="mr-2"
                showAllDataOption={true}
              />
            )}
            <UserProfileDropdown />
          </div>
        </div>
      </header>
      
      {!isMobile && (
        <nav className="bg-gray-950 border-b border-white/10">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="flex space-x-6">
              <NavLink 
                to="/rep-performance" 
                className={({ isActive }) => `py-3 flex items-center gap-2 text-sm ${isActive ? 'text-finance-red border-b-2 border-finance-red' : 'text-white/70 hover:text-white'}`}
              >
                <ChartLine className="h-4 w-4" />
                Reps
              </NavLink>
              <NavLink 
                to="/account-performance" 
                className={({ isActive }) => `py-3 flex items-center gap-2 text-sm ${isActive ? 'text-finance-red border-b-2 border-finance-red' : 'text-white/70 hover:text-white'}`}
              >
                <BarChart3 className="h-4 w-4" />
                Accounts
              </NavLink>
              <NavLink 
                to="/rep-tracker" 
                className={({ isActive }) => `py-3 flex items-center gap-2 text-sm ${isActive ? 'text-finance-red border-b-2 border-finance-red' : 'text-white/70 hover:text-white'}`}
              >
                <ClipboardList className="h-4 w-4" />
                Tracker
              </NavLink>
              <NavLink 
                to="/my-performance" 
                className={({ isActive }) => `py-3 flex items-center gap-2 text-sm ${isActive ? 'text-finance-red border-b-2 border-finance-red' : 'text-white/70 hover:text-white'}`}
              >
                <UserCircle className="h-4 w-4" />
                My Data
              </NavLink>
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default AppHeader;
