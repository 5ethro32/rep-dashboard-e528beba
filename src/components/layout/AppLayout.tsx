
import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This component handles collapsing the sidebar on route changes
const SidebarController = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Using the sidebar hooks inside this component which is rendered within the SidebarProvider
  const { setOpen } = useSidebar();
  
  // Collapse sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);
  
  return <>{children}</>;
};

// This component contains the sidebar toggle button and is used inside the SidebarProvider
const SidebarToggle = () => {
  const isMobile = useIsMobile();
  // Using the sidebar hooks inside this component which is rendered within the SidebarProvider
  const { toggleSidebar } = useSidebar();

  if (isMobile) return null;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleSidebar} 
      className="h-7 w-7 mr-2 text-white/70 hover:text-white hover:bg-white/10"
    >
      <ChevronRight size={18} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};

// Import the useSidebar hook here to use it within the components that are
// rendered inside the SidebarProvider
import { useSidebar } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  showChatInterface?: boolean;
  selectedMonth?: string;
}

const AppLayout = ({ 
  children, 
  showChatInterface = true, 
  selectedMonth = 'March' 
}: AppLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900 flex w-full">
        <AppSidebar />
        <SidebarController>
          <div className={`relative flex-1 ${isMobile ? 'pb-16' : ''}`}>
            <div className="py-4 px-4 flex items-center">
              <SidebarToggle />
            </div>
            {children}
            {showChatInterface && !isMobile && <ChatInterface selectedMonth={selectedMonth} />}
            {isMobile && <MobileNavigation />}
          </div>
        </SidebarController>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
