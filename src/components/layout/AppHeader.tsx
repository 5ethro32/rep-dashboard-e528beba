import React, { useState, useEffect } from 'react';
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
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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
        <div className="h-16 flex items-center justify-between">
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
        
        {/* Navigation bar - Only on desktop */}
        {!isMobile && (
          <div className="border-t border-white/5">
            <nav className="flex items-center py-1">
              {navItems.map((item) => 
                item.hasSubNav ? (
                  // For Engine Room, use the NavigationMenu component for better hover handling
                  <NavigationMenu key={item.path} className="relative">
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger 
                          className={cn(
                            "px-4 py-2 flex items-center gap-2 text-sm font-medium bg-transparent hover:bg-transparent focus:bg-transparent",
                            isEngineRoomSection ? "text-finance-red" : "text-white/60 hover:text-white"
                          )}
                        >
                          {isEngineRoomSection && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-finance-red to-rose-700"></div>
                          )}
                          {item.icon}
                          <span>{item.label}</span>
                        </NavigationMenuTrigger>
                        
                        <NavigationMenuContent 
                          className="absolute top-full left-0 w-40 bg-gray-950/95 backdrop-blur-sm border border-white/10 rounded-md shadow-lg overflow-hidden"
                        >
                          <div className="p-1">
                            {item.subItems?.map(subItem => (
                              <NavigationMenuLink key={subItem.path} asChild>
                                <NavLink 
                                  to={subItem.path} 
                                  className={({isActive}) => 
                                    cn("block px-4 py-2 text-sm rounded-sm", 
                                      isActive ? "bg-white/5 text-finance-red" : "text-white/70 hover:bg-white/5 hover:text-white")
                                  }
                                >
                                  {subItem.label}
                                </NavLink>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                ) : (
                  // Regular navigation links (non-Engine Room)
                  <NavLink 
                    key={item.path}
                    to={item.path} 
                    className={({isActive}) => cn(
                      "px-4 py-2 flex items-center gap-2 text-sm font-medium relative", 
                      isActive ? "text-finance-red" : "text-white/60 hover:text-white"
                    )}
                  >
                    {({isActive}) => (
                      <>
                        {/* Replace icon with gradient line for active items */}
                        {isActive && 
                          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-finance-red to-rose-700"></div>
                        }
                        {item.icon}
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              )}
            </nav>
          </div>
        )}

        {/* Alternative implementation using DropdownMenu for Engine Room subnav */}
        {!isMobile && isEngineRoomSection && (
          <div className="border-t border-white/5 bg-gray-900/60">
            <div className="flex px-4 py-1">
              <NavLink 
                to="/engine-room/dashboard"
                className={({ isActive }) => cn(
                  "px-4 py-1.5 text-sm font-medium relative",
                  isActive ? "text-finance-red" : "text-white/70 hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-finance-red to-rose-700"></div>
                    )}
                    Dashboard
                  </>
                )}
              </NavLink>
              
              <NavLink 
                to="/engine-room/engine"
                className={({ isActive }) => cn(
                  "px-4 py-1.5 text-sm font-medium relative",
                  isActive ? "text-finance-red" : "text-white/70 hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-finance-red to-rose-700"></div>
                    )}
                    Engine
                  </>
                )}
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </header>;
};

export default AppHeader;
