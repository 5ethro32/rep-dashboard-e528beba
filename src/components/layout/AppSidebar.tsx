
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ClipboardList, Home, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  const mainMenuItems = [
    {
      title: "Dashboard",
      url: "/rep-performance",
      icon: Home,
      isActive: location.pathname === "/rep-performance"
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
    }
  ];
  
  const settingsItem = {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    isActive: location.pathname === "/settings"
  };
  
  return (
    <div 
      className="hidden md:block" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Sidebar 
        collapsible="icon" 
        variant="floating" 
        className={`transition-all duration-300 ease-in-out ${isHovered ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-width-icon)]'} mt-14`} // Added mt-14 for top margin
      >
        <SidebarContent className="bg-gradient-to-b from-gray-900 to-gray-950 border-r border-white/5 flex flex-col h-full">
          <div className="px-4 py-3">
            <SidebarGroupLabel className={`text-sm font-bold text-white/90 ${!isHovered && 'opacity-0'}`}>
              Navigation
            </SidebarGroupLabel>
          </div>
          
          {/* Main navigation items */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
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
          
          {/* Push the settings to the bottom */}
          <div className="flex-grow"></div>
          
          {/* Separator before settings */}
          <SidebarSeparator className="my-2" />
          
          {/* Settings at the bottom */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={settingsItem.isActive} tooltip={settingsItem.title} className="hover:bg-white/10 data-[active=true]:bg-finance-red data-[active=true]:bg-opacity-20 data-[active=true]:text-white">
                    <Link to={settingsItem.url}>
                      <settingsItem.icon className={settingsItem.isActive ? "text-finance-red" : "text-white/70"} />
                      <span className={settingsItem.isActive ? "font-medium" : ""}>{settingsItem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </div>
  );
};

export default AppSidebar;
