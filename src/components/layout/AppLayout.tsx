
import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { SidebarProvider, useSidebar, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This component handles collapsing the sidebar on route changes
const SidebarController = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { setOpen } = useSidebar();
  
  // Collapse sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);
  
  return <>{children}</>;
};

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
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900 flex w-full">
        <AppSidebar />
        <SidebarController>
          <div className={`relative flex-1 ${isMobile ? 'pb-16' : ''}`}>
            <div className="py-4 px-4 flex items-center">
              {!isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSidebar} 
                  className="h-7 w-7 mr-2 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ChevronRight size={18} />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              )}
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
