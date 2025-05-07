
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ClipboardList, Home, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  const menuItems = [
    {
      title: "Dashboard",
      url: "/account-performance",
      icon: Home,
      isActive: location.pathname === "/account-performance"
    },
    {
      title: "Account Analysis",
      url: "/account-performance",
      icon: BarChart3,
      isActive: location.pathname === "/account-performance"
    },
    {
      title: "Rep Tracker",
      url: "/rep-tracker",
      icon: ClipboardList,
      isActive: location.pathname === "/rep-tracker"
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: location.pathname === "/settings"
    }
  ];
  
  return (
    <div 
      className="hidden md:block" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Sidebar 
        collapsible="icon" 
        variant="floating" 
        className={`transition-all duration-300 ease-in-out ${isHovered ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-width-icon)]'}`}
      >
        <SidebarContent className="bg-gradient-to-b from-gray-900 to-gray-950 border-r border-white/5">
          <div className="px-4 py-3">
            <SidebarGroupLabel className={`text-sm font-bold text-white/90 ${!isHovered && 'opacity-0'}`}>
              Navigation
            </SidebarGroupLabel>
          </div>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title} className="hover:bg-white/10 data-[active=true]:bg-finance-red data-[active=true]:bg-opacity-20 data-[active=true]:text-white">
                      <Link to={item.url}>
                        <item.icon className={item.isActive ? "text-finance-red" : "text-white/70"} />
                        <span className={item.isActive ? "font-medium" : ""}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className={`text-xs text-white/50 px-4 py-3 bg-gradient-to-b from-gray-900 to-gray-950 border-t border-white/5 ${!isHovered && 'opacity-0'}`}>
          Rep Dashboard
        </SidebarFooter>
      </Sidebar>
    </div>
  );
};

export default AppSidebar;
