
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ChartLine, 
  BarChart3, 
  ClipboardList, 
  UserCircle,
  Home,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  useSidebar
} from '@/components/ui/sidebar';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => {
  const { open } = useSidebar();
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 group",
        isActive 
          ? "bg-gray-800/70 text-finance-red" 
          : "text-white/60 hover:bg-gray-800/40 hover:text-white"
      )}
    >
      <div className="flex items-center justify-center w-10 h-10">
        {icon}
      </div>
      
      <span className={cn(
        "text-sm font-medium transition-all duration-300",
        !open && "opacity-0 translate-x-5 overflow-hidden"
      )}>
        {label}
      </span>
    </NavLink>
  );
};

export const AppSidebar = () => {
  const location = useLocation();

  const navItems = [
    {
      to: "/rep-performance",
      icon: <ChartLine className="h-5 w-5 transition-colors duration-200" />,
      label: "Reps"
    },
    {
      to: "/account-performance",
      icon: <BarChart3 className="h-5 w-5 transition-colors duration-200" />,
      label: "Accounts"
    },
    {
      to: "/rep-tracker",
      icon: <ClipboardList className="h-5 w-5 transition-colors duration-200" />,
      label: "Planner"
    },
    {
      to: "/my-performance",
      icon: <UserCircle className="h-5 w-5 transition-colors duration-200" />,
      label: "My Data"
    },
    {
      to: "/ai-vera",
      icon: <Bot className="h-5 w-5 transition-colors duration-200" />,
      label: "AI Vera"
    }
  ];

  return (
    <Sidebar 
      className="border-r border-white/10 bg-gray-950/95" 
      variant="sidebar" 
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        <div className="flex flex-col space-y-1 px-2">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.to}
            />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
