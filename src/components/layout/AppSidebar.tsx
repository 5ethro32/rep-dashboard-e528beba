
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ChevronLeft, ClipboardList } from 'lucide-react';
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  
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
      <SidebarContent className="bg-gradient-to-b from-gray-900 to-gray-950 border-r border-white/5">
        <div className="flex justify-between items-center px-4 py-3">
          <SidebarGroupLabel className="text-sm font-bold text-white/90">Navigation</SidebarGroupLabel>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft size={18} />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
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
      <SidebarFooter className="text-xs text-white/50 px-4 py-3 bg-gradient-to-b from-gray-900 to-gray-950 border-t border-white/5">
        Rep Dashboard
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
