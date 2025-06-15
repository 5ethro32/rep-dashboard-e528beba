
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import ChatInterface from '@/components/chat/ChatInterface';
import AppHeader from '@/components/layout/AppHeader';
import AnnouncementBanner from '@/components/layout/AnnouncementBanner';
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
  
  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Announcement banner at the very top - shows June profit changes */}
      {selectedMonth === 'June' && <AnnouncementBanner currentMonth={selectedMonth} />}
      
      {/* Single header with actions integrated */}
      <AppHeader 
        selectedUserId={selectedUserId} 
        onSelectUser={onSelectUser} 
        showUserSelector={showUserSelector}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
      
      {/* Main content section with appropriate padding for mobile bottom nav */}
      <div className="flex w-full relative">
        <div className={`flex-1 ${isMobile ? 'pb-20' : ''} overflow-x-auto overflow-y-auto`}>
          {children}
          {showChatInterface && isMobile && <ChatInterface selectedMonth={selectedMonth} />}
        </div>
        
        {/* Mobile navigation at bottom ONLY - no duplicate navigation */}
        {isMobile && <MobileNavigation />}
      </div>
    </div>
  );
};

export default AppLayout;
