
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart3, ClipboardList, UserCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

// MobileNavigation component for bottom navigation on mobile devices
const MobileNavigation = () => {
  const navItems = [
    {
      path: '/rep-performance',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/account-performance',
      label: 'Accounts',
      icon: BarChart3,
    },
    {
      path: '/rep-tracker',
      label: 'Planner',
      icon: ClipboardList,
    },
    {
      path: '/my-performance',
      label: 'My Dashboard',
      icon: UserCircle,
    },
    {
      path: '/engine-room',
      label: 'Engine',
      icon: Wrench,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-white/5 py-2 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center px-2 py-1 rounded-md transition-colors',
                isActive
                  ? 'text-finance-red'
                  : 'text-white/60 hover:text-white/80'
              )
            }
            end={item.path === '/rep-performance'} // Use 'end' prop to ensure exact matching for home route
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5')} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-finance-red to-rose-700"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;
