
import React, { useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';
import UserSelector from '@/components/rep-tracker/UserSelector';
import { Home, BarChart3, ClipboardList, UserCircle, Bot, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AppHeaderProps {
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
  showUserSelector?: boolean;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  selectedMonth?: string;
  setSelectedMonth?: (month: string) => void;
}

const AppHeader = ({ 
  selectedUserId, 
  onSelectUser, 
  showUserSelector = false,
  onRefreshData,
  isRefreshing = false,
  selectedMonth = 'March',
  setSelectedMonth
}: AppHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);
  
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

  const handleMonthChange = (value: string) => {
    if (setSelectedMonth) {
      setSelectedMonth(value);
    }
  };

  const navItems = [
    {
      path: '/rep-performance',
      label: 'Home',
      icon: <Home className="h-4 w-4" />
    },
    {
      path: '/account-performance',
      label: 'Accounts',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      path: '/rep-tracker',
      label: 'Tracker',
      icon: <ClipboardList className="h-4 w-4" />
    },
    {
      path: '/my-performance',
      label: 'My Data',
      icon: <UserCircle className="h-4 w-4" />
    },
    {
      path: '/ai-vera',
      label: 'AI Vera',
      icon: <Bot className="h-4 w-4" />
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-gray-950/95">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Main header with logo and user profile */}
        <div 
          className="h-16 flex items-center justify-between"
          onMouseEnter={() => !isMobile && setIsNavOpen(true)}
          onMouseLeave={() => !isMobile && setIsNavOpen(false)}
        >
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
            
            {!isMobile && (
              <div className="flex items-center ml-2">
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-white/70 transition-transform duration-200",
                    isNavOpen ? "rotate-180" : ""
                  )} 
                />
              </div>
            )}
            
            {/* Month selector */}
            {setSelectedMonth && (
              <div className="ml-4">
                <Select 
                  value={selectedMonth} 
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-[180px] bg-gray-900/40 border-white/10 text-white">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10 text-white">
                    <SelectItem value="February">February</SelectItem>
                    <SelectItem value="March">March</SelectItem>
                    <SelectItem value="April">April</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
            
            {/* Refresh Icon Button */}
            {onRefreshData && (
              <Button
                onClick={onRefreshData}
                size="icon"
                variant="ghost"
                className={cn(
                  "rounded-full",
                  isRefreshing 
                    ? "text-finance-red" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh Data</span>
              </Button>
            )}
            
            <UserProfileDropdown />
          </div>
        </div>
        
        {/* Navigation bar - Only collapsible on desktop, not shown on mobile at all as mobile has bottom navbar */}
        {!isMobile && (
          <div 
            className={cn(
              "border-t border-white/5 overflow-hidden transition-all duration-300",
              isNavOpen ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
            )}
            onMouseEnter={() => setIsNavOpen(true)}
            onMouseLeave={() => setIsNavOpen(false)}
          >
            <nav className="flex items-center py-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "px-4 py-2 flex items-center gap-2 text-sm font-medium",
                    isActive 
                      ? "text-finance-red" 
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
