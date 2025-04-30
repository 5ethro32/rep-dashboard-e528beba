
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, MessageCircle } from 'lucide-react';
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
      icon: Users,
      label: 'Accounts',
      path: '/account-performance',
    },
    {
      icon: Calendar,
      label: 'Rep Tracker',
      path: '/rep-tracker',
    },
    {
      icon: MessageCircle,
      label: 'Carlos AI',
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
                "flex items-center justify-center",
                isActive 
                  ? "text-finance-red" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
