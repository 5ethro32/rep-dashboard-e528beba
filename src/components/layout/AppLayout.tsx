
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';

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
        <div className={`relative flex-1 ${isMobile ? 'pb-16' : ''}`}>
          <div className="py-4 px-4">
            {!isMobile && (
              <SidebarTrigger className="absolute top-4 left-4 z-10 text-white/60 hover:text-white" />
            )}
          </div>
          {children}
          {showChatInterface && !isMobile && <ChatInterface selectedMonth={selectedMonth} />}
          {isMobile && <MobileNavigation />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
