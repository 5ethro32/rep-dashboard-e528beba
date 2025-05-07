
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import ChatInterface from '@/components/chat/ChatInterface';
import AppHeader from '@/components/layout/AppHeader';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  showChatInterface?: boolean;
  selectedMonth?: string;
  selectedUserId?: string | null;
  onSelectUser?: (userId: string | null, displayName: string) => void;
}

const AppLayout = ({ 
  children, 
  showChatInterface = true, 
  selectedMonth = 'March',
  selectedUserId,
  onSelectUser
}: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isAccountPerformancePage = location.pathname === '/account-performance';
  const isRepTrackerPage = location.pathname === '/rep-tracker';

  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <AppHeader 
        selectedUserId={selectedUserId} 
        onSelectUser={onSelectUser} 
        showUserSelector={isAccountPerformancePage || isRepTrackerPage}
      />
      <div className={`relative ${isMobile ? 'pb-16' : ''}`}>
        {children}
        {showChatInterface && !isMobile && <ChatInterface selectedMonth={selectedMonth} />}
        {isMobile && <MobileNavigation />}
      </div>
    </div>
  );
};

export default AppLayout;
