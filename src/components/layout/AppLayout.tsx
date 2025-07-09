import React, { useState, useEffect } from 'react';
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
  
  // Get live rep performance data if available - with periodic updates
  const [repPerformanceData, setRepPerformanceData] = useState((window as any).repPerformanceData);
  
  // Check for updated data periodically when on rep performance or inventory pages
  useEffect(() => {
    if (location.pathname === '/rep-performance' || location.pathname === '/engine-room/inventory') {
      const checkForUpdates = () => {
        const currentData = (window as any).repPerformanceData;
        if (currentData && JSON.stringify(currentData) !== JSON.stringify(repPerformanceData)) {
          const pageType = location.pathname === '/rep-performance' ? 'rep performance' : 'inventory';
          console.log(`🔄 AppLayout detected updated ${pageType} data, refreshing announcement banner`);
          setRepPerformanceData(currentData);
        }
      };
      
      // Check immediately and then every second
      checkForUpdates();
      const interval = setInterval(checkForUpdates, 1000);
      
      return () => clearInterval(interval);
    }
  }, [location.pathname, repPerformanceData]);
  
  const liveRepChanges = repPerformanceData?.repChanges;
  const liveSelectedMonth = repPerformanceData?.selectedMonth;
  
  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Announcement banner at the very top - shows live profit changes when data is available */}
      {liveRepChanges && Object.keys(liveRepChanges).length > 0 && (
        <AnnouncementBanner 
          currentMonth={liveSelectedMonth || selectedMonth}
          repChangesData={liveRepChanges}
        />
      )}
      
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
