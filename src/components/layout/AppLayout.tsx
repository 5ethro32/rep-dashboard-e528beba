
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';

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

// Import the useSidebar hook here to use it within the components that are
// rendered inside the SidebarProvider
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect } from 'react';

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
      <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900 flex w-full flex-col">
        <AppHeader />
        <div className="flex flex-1 w-full pt-14"> {/* Added pt-14 for padding-top to account for the header height */}
          <AppSidebar />
          <SidebarController>
            <div className={`relative flex-1 ${isMobile ? 'pb-16' : ''}`}>
              {children}
              {showChatInterface && !isMobile && <ChatInterface selectedMonth={selectedMonth} />}
              {isMobile && <MobileNavigation />}
            </div>
          </SidebarController>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
