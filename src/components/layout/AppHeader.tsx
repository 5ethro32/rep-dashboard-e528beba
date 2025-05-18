import React, { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, BarChart3, ClipboardList, UserCircle, BrainCircuit, ChevronDown, Menu, X, CircleUser, Search, Wrench, RefreshCw } from 'lucide-react';
import UserProfileDropdown from '@/components/auth/UserProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
  showUserSelector?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  selectedUserId, 
  onSelectUser, 
  showUserSelector = false,
  onRefresh,
  isLoading = false
}) => {
  const {
    user
  } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isEngineSubnavHovered, setIsEngineSubnavHovered] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedItems, setMobileExpandedItems] = useState<string[]>([]);

  // Check if we're in the Engine Room section
  const isEngineRoomSection = location.pathname.startsWith('/engine-room');
  const isEngineDashboard = location.pathname === '/engine-room/dashboard';
  const isEngineOperations = location.pathname === '/engine-room/operations';
  const isEngineApprovals = location.pathname === '/engine-room/approvals';

  // Add debug logging for props
  console.log('AppHeader props:', { 
    path: location.pathname, 
    showUserSelector, 
    selectedUserId,
    hasOnSelectUser: !!onSelectUser,
    hasRefresh: !!onRefresh,
    isLoading
  });

  // Method to handle global refresh
  const handleRefresh = () => {
    // Check if we're on RepPerformance page and use its refresh method if available
    if (window.repPerformanceRefresh && location.pathname === '/rep-performance') {
      console.log('Triggering RepPerformance refresh');
      window.repPerformanceRefresh();
      return;
    }
    
    // Check if we're on MyPerformance page and use its refresh method if available
    if (window.myPerformanceRefresh && location.pathname === '/my-performance') {
      console.log('Triggering MyPerformance refresh');
      window.myPerformanceRefresh();
      return;
    }
    
    // Use the provided onRefresh callback from props if available
    if (onRefresh) {
      console.log('Using provided refresh callback');
      onRefresh();
      return;
    }
    
    // Fallback toast if no refresh method is available
    toast({
      title: "Refresh requested",
      description: "No refresh handler available for this page"
    });
  };

  // Function to get the current page title based on the URL path
  const getPageTitle = () => {
    // Determine page title based on current route
    const path = location.pathname;
    
    if (path === '/') return 'Home';
    if (path === '/rep-performance') return 'Rep Performance';
    if (path === '/account-performance') {
      // Add logic for AccountPerformance title
      if (selectedUserId === "all") {
        return "Aver's Accounts";
      } 
      const firstName = selectedUserName === 'My Data' ? 'My' : selectedUserName.split(' ')[0];
      const displayName = firstName === 'My' ? 'My' : `${firstName}'s`;
      return `${displayName} Accounts`;
    }
    if (path === '/ai-vera') return 'AI Vera Assistant';
    if (path === '/rep-tracker') return 'Rep Planner';
    if (path === '/my-performance') return 'My Performance Dashboard';
    if (path.startsWith('/engine-room')) {
      if (path === '/engine-room') return 'Engine Room';
      if (path === '/engine-room/operations') return 'Engine Operations';
      if (path === '/engine-room/dashboard') return 'Engine Dashboard';
      if (path === '/engine-room/approvals') return 'Approvals Dashboard';
      if (path === '/engine-room/simulator') return 'Rule Simulator';
      if (path === '/engine-room/analytics') return 'Pricing Analytics';
      return 'Engine Room';
    }
    
    // Default title
    return 'REVA Platform';
  };
  
  const getPageDescription = () => {
    // Add descriptions for different pages
    const path = location.pathname;
    
    if (path === '/rep-performance') 
      return "Track and analyze rep performance metrics across different departments.";
    if (path === '/account-performance') {
      return selectedUserId === "all" 
        ? "Compare Aver's accounts performance between months to identify declining or improving accounts." 
        : selectedUserName && selectedUserName !== 'My Data' 
          ? `Compare ${selectedUserName.split(' ')[0]}'s accounts performance between months to identify declining or improving accounts.` 
          : "Compare your accounts performance between months to identify declining or improving accounts.";
    }
    if (path === '/ai-vera') 
      return "Get AI-powered assistance for your day-to-day sales operations.";
    if (path === '/rep-tracker') 
      return "Plan and track customer visits and interactions.";
    if (path === '/my-performance') 
      return "View your personalized performance metrics and insights.";
    if (path === '/engine-room') 
      return "Access and manage pricing engine operations and configurations.";
    if (path === '/engine-room/operations') 
      return "Configure operational settings for the pricing engine.";
    if (path === '/engine-room/dashboard') 
      return "View key engine metrics and performance dashboard.";
    if (path === '/engine-room/approvals') 
      return "Review and process pending approval requests.";
    if (path === '/engine-room/simulator') 
      return "Simulate pricing rules and view potential impacts.";
    if (path === '/engine-room/analytics') 
      return "Analyze pricing data and identify optimization opportunities.";
      
    return "Welcome to the REVA Platform";
  };

  // Function to toggle mobile submenu
  const toggleMobileSubmenu = (path: string) => {
    if (mobileExpandedItems.includes(path)) {
      setMobileExpandedItems(mobileExpandedItems.filter(item => item !== path));
    } else {
      setMobileExpandedItems([...mobileExpandedItems, path]);
    }
  };

  // Function to toggle dropdown
  const toggleDropdown = (path: string) => {
    if (activeDropdown === path) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(path);
    }
  };

  // Ensure we're using Link components for all navigation items
  const navItems = [{
    path: '/rep-performance',
    label: 'Home',
    icon: <Home className="mr-2 h-4 w-4" />,
  }, {
    path: '/account-performance',
    label: 'Accounts',
    icon: <BarChart3 className="mr-2 h-4 w-4" />,
  }, {
    path: '/rep-tracker',
    label: 'Planner',
    icon: <ClipboardList className="mr-2 h-4 w-4" />,
  }, {
    path: '/my-performance',
    label: 'My Dashboard',
    icon: <UserCircle className="mr-2 h-4 w-4" />,
  }, {
    path: '/engine-room',
    label: 'Engine Room',
    icon: <Wrench className="mr-2 h-4 w-4" />,
    subItems: [{
      path: '/engine-room/dashboard',
      label: 'Dashboard',
    }, {
      path: '/engine-room/operations',
      label: 'Operations',
    }, {
      path: '/engine-room/simulator',
      label: 'Rule Simulator',
    }, {
      path: '/engine-room/approvals',
      label: 'Approvals',
    }, {
      path: '/engine-room/analytics',
      label: 'Analytics',
    }]
  }, {
    path: '/ai-vera',
    label: 'AI Vera',
    icon: <BrainCircuit className="mr-2 h-4 w-4" />,
  }];

  // Check if refresh functionality should be shown
  const showRefresh = onRefresh !== undefined || location.pathname === '/rep-performance' && window.repPerformanceRefresh !== undefined;
  
  return (
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left section - Logo / Mobile Menu Button */}
        <div className="flex items-center">
          {isMobile && (
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)} 
              className="mr-2 p-1 rounded-md hover:bg-white/10"
            >
              {isNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
          
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-600">
              REVA
            </span>
          </div>
        </div>
        
        {/* Center section - Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-12">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search..."
              className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Right section - Navigation, User Menu */}
        <div className="flex items-center space-x-2">
          {/* Add refresh button */}
          {onRefresh && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="bg-transparent border-white/10 hover:bg-white/5"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          
          {/* User selector if enabled */}
          {showUserSelector && onSelectUser && (
            <div className="mr-2">
              <UserSelector selectedUserId={selectedUserId || "all"} onSelectUser={handleUserSelection} showAllDataOption={true} />
            </div>
          )}
          
          <UserProfileDropdown />
        </div>
      </div>
      
      {/* Page title section */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-950 to-gray-900">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        <p className="text-sm text-white/60">{getPageDescription()}</p>
      </div>
      
      {/* Navigation - Desktop */}
      <nav className="hidden md:flex px-4 py-1 border-b border-white/5 overflow-x-auto">
        {navItems.map((item, i) => (
          <React.Fragment key={item.path}>
            {item.subItems ? (
              <div className="relative group">
                <button
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                    location.pathname.startsWith(item.path) 
                      ? "text-white bg-white/10" 
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => toggleDropdown(item.path)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                {activeDropdown === item.path && (
                  <div className="absolute left-0 mt-1 w-48 bg-gray-900 border border-white/10 rounded-md shadow-lg z-10">
                    {item.subItems.map(subItem => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({isActive}) => cn(
                          "block px-4 py-2 text-sm rounded-md transition-colors",
                          isActive ? 
                            "bg-white/10 text-transparent bg-clip-text bg-gradient-to-r from-finance-red to-rose-700" : 
                            "text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                        end
                      >
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to={item.path}
                className={({isActive}) => cn(
                  "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                  isActive ? 
                    "text-transparent bg-clip-text bg-gradient-to-r from-finance-red to-rose-700" : 
                    "text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 hover:text-white"
                )}
                end={item.path === '/rep-performance'}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            )}
            
            {i < navItems.length - 1 && (
              <Separator orientation="vertical" className="h-6 mx-1 my-auto bg-white/10" />
            )}
          </React.Fragment>
        ))}
      </nav>
      
      {/* Mobile Navigation Dropdown */}
      {isMobile && isNavOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-b border-white/5 z-50">
          <div className="p-4 space-y-3">
            {navItems.map((item) => (
              <div key={item.path}>
                {item.subItems ? (
                  <div>
                    <button
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                        location.pathname.startsWith(item.path) 
                          ? "text-white bg-white/10" 
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      )}
                      onClick={() => toggleMobileSubmenu(item.path)}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${mobileExpandedItems.includes(item.path) ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {mobileExpandedItems.includes(item.path) && (
                      <div className="mt-1 ml-8 space-y-1">
                        {item.subItems.map(subItem => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            className={({isActive}) => cn(
                              "block px-4 py-2 text-sm rounded-md transition-colors",
                              isActive ? 
                                "bg-white/10 text-transparent bg-clip-text bg-gradient-to-r from-finance-red to-rose-700" : 
                                "text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400")
                            }
                            onClick={() => setIsNavOpen(false)}
                            end
                          >
                            {subItem.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({isActive}) => cn(
                        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                        isActive ? 
                            "bg-white/10 text-transparent bg-clip-text bg-gradient-to-r from-finance-red to-rose-700" : 
                            "text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 hover:text-white"
                    )}
                    onClick={() => isMobile && setIsNavOpen(false)}
                    end={item.path === '/rep-performance'}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
