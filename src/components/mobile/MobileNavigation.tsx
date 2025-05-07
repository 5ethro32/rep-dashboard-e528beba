
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, ClipboardList, ChartLine, UserCircle } from 'lucide-react';

const MobileNavigation = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-white/10 p-2 px-4 z-40">
      <div className="flex justify-around items-center">
        <NavLink
          to="/rep-performance"
          className={({ isActive }) => `p-2 flex flex-col items-center ${
            isActive ? 'text-finance-red' : 'text-white/70'
          }`}
        >
          <ChartLine className="h-5 w-5" />
          <span className="text-2xs mt-1">Reps</span>
        </NavLink>
        
        <NavLink
          to="/account-performance"
          className={({ isActive }) => `p-2 flex flex-col items-center ${
            isActive ? 'text-finance-red' : 'text-white/70'
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-2xs mt-1">Accounts</span>
        </NavLink>
        
        <NavLink
          to="/rep-tracker"
          className={({ isActive }) => `p-2 flex flex-col items-center ${
            isActive ? 'text-finance-red' : 'text-white/70'
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-2xs mt-1">Tracker</span>
        </NavLink>
        
        <NavLink
          to="/my-performance"
          className={({ isActive }) => `p-2 flex flex-col items-center ${
            isActive ? 'text-finance-red' : 'text-white/70'
          }`}
        >
          <UserCircle className="h-5 w-5" />
          <span className="text-2xs mt-1">My Data</span>
        </NavLink>
      </div>
    </div>
  );
};

export default MobileNavigation;
