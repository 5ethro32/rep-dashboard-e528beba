
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, Users, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/rep-performance',
    },
    {
      icon: Activity,
      label: 'Accounts',
      path: '/account-performance',
    },
    {
      icon: Users,
      label: 'Rep Tracker',
      path: '/rep-tracker',
    },
    {
      icon: Bot,
      label: 'AI Vera',
      path: '/ai-vera',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 border-t border-white/10 backdrop-blur-lg">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center space-y-1",
                isActive 
                  ? "text-finance-red" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
