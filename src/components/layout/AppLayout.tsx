
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
  showUserSelector?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const AppLayout = ({ 
  children, 
  showChatInterface = true,
  selectedMonth = 'March',
  selectedUserId,
  onSelectUser,
  showUserSelector = false,
  onRefresh,
  isLoading = false
}: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Additional logging to debug user selection propagation
  console.log('AppLayout rendering with:', { 
    path: location.pathname, 
    selectedUserId, 
    showUserSelector,
    hasOnSelectUser: !!onSelectUser,
    hasRefresh: !!onRefresh,
    isLoading
  });

  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header section with integrated navigation - only render once */}
      <AppHeader 
        selectedUserId={selectedUserId} 
        onSelectUser={onSelectUser} 
        showUserSelector={showUserSelector}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
      
      {/* Main content section */}
      <div className="flex w-full relative">
        <div className={`flex-1 ${isMobile ? 'pb-16' : ''} overflow-x-auto overflow-y-auto`}>
          {children}
          {showChatInterface && isMobile && <ChatInterface selectedMonth={selectedMonth} />}
        </div>
        
        {isMobile && <MobileNavigation />}
      </div>
    </div>
  );
};

export default AppLayout;
