
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/components/layout/AppLayout';
import AccountPerformancePage from '@/components/rep-performance/AccountPerformancePage';
import { useAccountPerformanceData } from '@/hooks/useAccountPerformanceData';

const AccountPerformance = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('May');
  // Add state for user selection, with "all" as default
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");
  const [selectedUserName, setSelectedUserName] = useState<string>('All Data');
  
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const { 
    currentMonthRawData, 
    previousMonthRawData, 
    isLoading, 
    fetchComparisonData 
  } = useAccountPerformanceData({
    selectedMonth,
    selectedUserId,
    user,
    selectedUserName
  });
  
  // Handle user selection change
  const handleUserChange = (userId: string | null, displayName: string) => {
    console.log(`User changed to: ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    // Data will refresh due to the useEffect dependency in useAccountPerformanceData
  };

  return (
    <AppLayout 
      showChatInterface={!isMobile}
      selectedUserId={selectedUserId}
      onSelectUser={handleUserChange}
    >
      <AccountPerformancePage 
        selectedUserId={selectedUserId}
        selectedUserName={selectedUserName}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        currentMonthRawData={currentMonthRawData}
        previousMonthRawData={previousMonthRawData}
        isLoading={isLoading}
        fetchComparisonData={fetchComparisonData}
      />
    </AppLayout>
  );
};

export default AccountPerformance;
