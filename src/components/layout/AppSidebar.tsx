
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ClipboardList } from 'lucide-react';
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
  
  const menuItems = [
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
  
  return (
    <Sidebar collapsible="offcanvas" variant="floating" className="hidden md:flex">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-xs text-white/30 px-4">
        Finance Dashboard
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
