import React, { useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';
import UserSelector from '@/components/rep-tracker/UserSelector';
import { Home, BarChart3, ClipboardList, UserCircle, Bot, ChevronDown, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import VeraAssistant from '@/components/chat/VeraAssistant';
interface AppHeaderProps {
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
  showUserSelector?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}
const AppHeader = ({
  selectedUserId,
  onSelectUser,
  showUserSelector = false,
  onRefresh,
  isLoading = false
}: AppHeaderProps) => {
  const {
    user
  } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSubNavOpen, setIsSubNavOpen] = useState(false);
  const [isVeraOpen, setIsVeraOpen] = useState(false);

  // Check if we're in the Engine Room section
  const isEngineRoomSection = location.pathname.startsWith('/engine-room');
  const isEngineDashboard = location.pathname === '/engine-room/dashboard';
  const isEngineOperations = location.pathname === '/engine-room/engine';

  // Function to get the current page title based on the URL path
  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/rep-performance':
        return isMobile ? 'Dashboard' : 'Performance Dashboard';
      case '/account-performance':
        return isMobile ? 'Accounts' : 'Account Performance';
      case '/rep-tracker':
        return isMobile ? 'Planner' : 'Rep Planner';
      case '/my-performance':
        return isMobile ? 'My Dashboard' : 'My Dashboard';
      case '/ai-vera':
        return isMobile ? 'Vera' : 'AI Vera';
      case '/engine-room':
      case '/engine-room/dashboard':
      case '/engine-room/engine':
        const subSection = isEngineDashboard ? 'Dashboard' : isEngineOperations ? 'Engine' : '';
        return isMobile ? 'Engine' : `Engine Room${subSection ? ` / ${subSection}` : ''}`;
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
  const handleRefreshClick = () => {
    console.log('Refresh button clicked in AppHeader');

    // Check if we're on the rep performance page and have a specific refresh handler
    if (location.pathname === '/rep-performance' && window.repPerformanceRefresh) {
      console.log('Using RepPerformance refresh handler');
      try {
        window.repPerformanceRefresh();

        // No need to show toast here as the component will handle it
      } catch (error) {
        console.error('Error calling RepPerformance refresh:', error);
        toast({
          title: "Refresh failed",
          description: "Could not refresh the dashboard data",
          variant: "destructive"
        });
      }
      return;
    }

    // Otherwise use the global refresh handler
    if (onRefresh) {
      console.log('Using global refresh handler');
      onRefresh();
    }
  };
  const navItems = [{
    path: '/rep-performance',
    label: 'Home',
    icon: <Home className="h-4 w-4" />
  }, {
    path: '/account-performance',
    label: 'Accounts',
    icon: <BarChart3 className="h-4 w-4" />
  }, {
    path: '/rep-tracker',
    label: 'Planner',
    icon: <ClipboardList className="h-4 w-4" />
  }, {
    path: '/my-performance',
    label: 'My Dashboard',
    icon: <UserCircle className="h-4 w-4" />
  }, {
    path: '/ai-vera',
    label: 'AI Vera',
    icon: <Bot className="h-4 w-4" />
  }, {
    path: '/engine-room/dashboard',
    label: 'Engine Room',
    icon: <Settings className="h-4 w-4" />,
    hasSubNav: true,
    subItems: [{
      path: '/engine-room/dashboard',
      label: 'Dashboard'
    }, {
      path: '/engine-room/engine',
      label: 'Engine'
    }]
  }];

  // Check if refresh functionality should be shown
  const showRefresh = onRefresh !== undefined || location.pathname === '/rep-performance' && window.repPerformanceRefresh !== undefined;
  return <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-gray-950/95">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Main header with logo and user profile */}
        <div className="h-16 flex items-center justify-between" onMouseEnter={() => !isMobile && setIsNavOpen(true)} onMouseLeave={() => !isMobile && setIsNavOpen(false)}>
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
            
            {!isMobile && <div className="flex items-center ml-2">
                <ChevronDown className={cn("h-4 w-4 text-white/70 transition-transform duration-200", isNavOpen ? "rotate-180" : "")} />
              </div>}
          </div>
          
          <div className="flex items-center gap-3">
            {showRefresh && <Button variant="ghost" size="icon" onClick={handleRefreshClick} disabled={isLoading} className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>}
            
            {/* Only show Vera Assistant Button on desktop */}
            {!isMobile && <button className="flex items-center justify-center h-7 w-7 transition-transform duration-200 hover:scale-110 hover:shadow-lg shadow-md" onClick={() => setIsVeraOpen(!isVeraOpen)} aria-label="Open Vera Assistant">
                <div className="flex items-center justify-center h-6 w-6 bg-gradient-to-r from-finance-red to-rose-700 text-white rounded-none transform rotate-45 shadow-md">
                  <span className="transform -rotate-45 font-bold text-sm">V</span>
                </div>
              </button>}
            
            {showUserSelector && <UserSelector selectedUserId={selectedUserId || "all"} onSelectUser={handleUserSelection} showAllDataOption={true} />}
            <UserProfileDropdown />
          </div>
        </div>
        
        {/* Vera Assistant Dropdown - Only shown when isVeraOpen is true */}
        {!isMobile && isVeraOpen && <div className="absolute right-4 top-16 z-50 w-96 overflow-hidden">
            <VeraAssistant onClose={() => setIsVeraOpen(false)} />
          </div>}
        
        {/* Navigation bar - Only collapsible on desktop, not shown on mobile at all as mobile has bottom navbar */}
        {!isMobile && <div className={cn("border-t border-white/5 overflow-hidden transition-all duration-300", isNavOpen ? "max-h-16 opacity-100" : "max-h-0 opacity-0")} onMouseEnter={() => setIsNavOpen(true)} onMouseLeave={() => setIsNavOpen(false)}>
            <nav className="flex items-center py-1">
              {navItems.map(item => <div key={item.path} className="relative" onMouseEnter={() => item.hasSubNav && setIsSubNavOpen(true)} onMouseLeave={() => item.hasSubNav && setIsSubNavOpen(false)}>
                  <NavLink to={item.path} className={({
              isActive
            }) => cn("px-4 py-2 flex items-center gap-2 text-sm font-medium relative", isActive || item.hasSubNav && isEngineRoomSection ? "text-finance-red" : "text-white/60 hover:text-white")}>
                    {({
                isActive
              }) => <>
                        {/* Replace icon with gradient line for active items */}
                        {(isActive || item.hasSubNav && isEngineRoomSection) && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-finance-red to-rose-700"></div>}
                        <span>{item.label}</span>
                        {item.hasSubNav && <ChevronDown className={cn("h-3 w-3 ml-0.5 transition-transform", isSubNavOpen ? "rotate-180" : "")} />}
                      </>}
                  </NavLink>
                  
                  {/* Subnav Dropdown for Engine Room */}
                  {item.hasSubNav && isSubNavOpen && <div className="absolute top-full left-0 w-40 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-50 overflow-hidden" onMouseEnter={() => setIsSubNavOpen(true)} onMouseLeave={() => setIsSubNavOpen(false)}>
                      {item.subItems?.map(subItem => <NavLink key={subItem.path} to={subItem.path} className={({
                isActive
              }) => cn("block px-4 py-2 text-sm", isActive ? "bg-gray-800 text-finance-red" : "text-white/70 hover:bg-gray-800 hover:text-white")}>
                          {subItem.label}
                        </NavLink>)}
                    </div>}
                </div>)}
            </nav>
          </div>}
      </div>
      
      {/* Engine Room Sub-Navigation when in Engine Room section */}
      {!isMobile && isEngineRoomSection && <div className="bg-gray-900/80 border-t border-b border-gray-800/40">
          
        </div>}
    </header>;
};
export default AppHeader;