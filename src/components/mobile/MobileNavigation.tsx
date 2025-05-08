
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

// MobileNavigation component for bottom navigation on mobile devices
const MobileNavigation = () => {
  const navItems = [
    {
      path: '/rep-performance',
      label: 'Home',
    },
    {
      path: '/account-performance',
      label: 'Accounts',
    },
    {
      path: '/rep-tracker',
      label: 'Planner',
    },
    {
      path: '/my-performance',
      label: 'My Dashboard',
    },
    {
      path: '/ai-vera',
      label: 'Vera',
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
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center justify-center">
                  <span className={cn('text-sm', isActive ? 'text-finance-red' : 'text-white/60')}>
                    {isActive ? '/' : ''}
                  </span>
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </div>
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
