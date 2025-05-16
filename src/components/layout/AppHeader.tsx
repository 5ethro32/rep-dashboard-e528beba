
import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';
import UserSelector from '@/components/rep-tracker/UserSelector';
import { Home, BarChart3, ClipboardList, UserCircle, ChevronDown, RefreshCw, Wrench, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink
} from "@/components/ui/navigation-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
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
  const [isEngineSubnavHovered, setIsEngineSubnavHovered] = useState(false);

  // Check if we're in the Engine Room section
  const isEngineRoomSection = location.pathname.startsWith('/engine-room');
  const isEngineDashboard = location.pathname === '/engine-room/dashboard';
  const isEngineOperations = location.pathname === '/engine-room/operations';
  const isEngineApprovals = location.pathname === '/engine-room/approvals';

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
      case '/engine-room/dashboard':
        return isMobile ? 'Engine' : 'Engine Room / Dashboard';
      case '/engine-room/operations':
        return isMobile ? 'Operations' : 'Engine Room / Operations';
      case '/engine-room/approvals':
        return isMobile ? 'Approvals' : 'Engine Room / Approvals';
      case '/engine-room':
        return isMobile ? 'Engine' : 'Engine Room';
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
    path: '/engine-room/dashboard',
    label: 'Engine Room',
    icon: <Wrench className="h-4 w-4" />,
    hasSubNav: true,
    subItems: [{
      path: '/engine-room/dashboard',
      label: 'Dashboard'
    }, {
      path: '/engine-room/operations',
      label: 'Operations'
    }, {
      path: '/engine-room/approvals',
      label: 'Approvals'
    }]
  }];

  // Check if refresh functionality should be shown
  const showRefresh = onRefresh !== undefined || location.pathname === '/rep-performance' && window.repPerformanceRefresh !== undefined;
  
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-gray-950/95">
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
            
            {showUserSelector && <UserSelector selectedUserId={selectedUserId || "all"} onSelectUser={handleUserSelection} showAllDataOption={true} />}
            <UserProfileDropdown />
            
            {/* Mobile menu toggle */}
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsNavOpen(!isNavOpen)} 
                className="ml-2 text-white/70 hover:text-white"
              >
                {isNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
        
        {/* Navigation bar - Desktop (always visible) and Mobile (collapsible) */}
        {(!isMobile || isNavOpen) && (
          <div className={`${isMobile ? 'py-2' : 'border-t border-white/5'}`}>
            <nav className={`flex ${isMobile ? 'flex-col' : 'items-center'} py-1`}>
              {navItems.map((item) => 
                item.hasSubNav ? (
                  // Engine Room navigation with hover functionality
                  <div
                    key={item.path}
                    className="relative"
                    onMouseEnter={() => !isMobile && setIsEngineSubnavHovered(true)}
                    onMouseLeave={() => !isMobile && setIsEngineSubnavHovered(false)}
                  >
                    {isMobile ? (
                      // Mobile version - collapsible dropdown
                      <Collapsible>
                        <CollapsibleTrigger className="w-full">
                          <div className={cn(
                            "px-4 py-2 flex items-center justify-between text-sm font-medium", 
                            isEngineRoomSection ? "text-finance-red" : "text-white/60"
                          )}>
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-8 space-y-1 py-1">
                            {item.subItems?.map(subItem => (
                              <NavLink 
                                key={subItem.path}
                                to={subItem.path} 
                                className={({isActive}) => 
                                  cn("block py-2 text-sm", 
                                    isActive ? "text-finance-red" : "text-white/70 hover:text-white")
                                }
                                onClick={() => setIsNavOpen(false)}
                              >
                                {subItem.label}
                              </NavLink>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      // Desktop version - hover dropdown
                      <>
                        <Link 
                          to={item.path} 
                          className={cn(
                            "px-4 py-2 flex items-center gap-2 text-sm font-medium relative", 
                            isEngineRoomSection ? "text-finance-red" : "text-white/60 hover:text-white"
                          )}
                        >
                          {isEngineRoomSection && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-finance-red to-rose-700"></div>
                          )}
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                        
                        {/* Subnav that appears on hover */}
                        {isEngineSubnavHovered && (
                          <div 
                            className={cn(
                              "absolute top-full left-0 bg-gray-950/95 backdrop-blur-sm border border-white/10 rounded-md shadow-lg overflow-hidden z-50",
                              "transition-all duration-200",
                              "opacity-100 translate-y-0"
                            )}
                          >
                            <div className="p-1">
                              {item.subItems?.map(subItem => (
                                <NavLink 
                                  key={subItem.path}
                                  to={subItem.path} 
                                  className={({isActive}) => 
                                    cn("block px-4 py-2 text-sm rounded-sm", 
                                      isActive ? "bg-white/5 text-finance-red" : "text-white/70 hover:bg-white/5 hover:text-white")
                                  }
                                >
                                  {subItem.label}
                                </NavLink>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  // Regular navigation links
                  <NavLink 
                    key={item.path}
                    to={item.path} 
                    className={({isActive}) => cn(
                      `${isMobile ? 'py-3' : 'px-4 py-2'} flex items-center gap-2 text-sm font-medium relative`, 
                      isActive ? "text-finance-red" : "text-white/60 hover:text-white"
                    )}
                    onClick={() => isMobile && setIsNavOpen(false)}
                  >
                    {({isActive}) => (
                      <>
                        {isActive && !isMobile && 
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
      </div>
    </header>
  );
};

export default AppHeader;
