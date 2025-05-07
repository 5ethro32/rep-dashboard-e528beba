
import React from 'react';
import PageHeading from './PageHeading';
import RefreshControls from './RefreshControls';
import AccountSummaryCards from './AccountSummaryCards';
import AccountPerformanceComparison from './AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';

interface AccountPerformancePageProps {
  selectedUserId: string | null;
  selectedUserName: string;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  currentMonthRawData: any[];
  previousMonthRawData: any[];
  isLoading: boolean;
  fetchComparisonData: () => void;
}

const AccountPerformancePage = ({
  selectedUserId,
  selectedUserName,
  selectedMonth,
  setSelectedMonth,
  currentMonthRawData,
  previousMonthRawData,
  isLoading,
  fetchComparisonData
}: AccountPerformancePageProps) => {
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
      <PageHeading selectedUserId={selectedUserId} selectedUserName={selectedUserName} />
      
      <RefreshControls 
        isLoading={isLoading}
        onRefresh={fetchComparisonData}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />
      
      <AccountSummaryCards
        currentMonthData={currentMonthRawData}
        previousMonthData={previousMonthRawData}
        isLoading={isLoading}
        selectedUser={selectedUserId !== "all" ? selectedUserName : undefined}
      />
      
      <div className="mb-12">
        <AccountPerformanceComparison 
          currentMonthData={currentMonthRawData}
          previousMonthData={previousMonthRawData}
          isLoading={isLoading}
          selectedMonth={selectedMonth}
          formatCurrency={formatCurrency}
          selectedUser={selectedUserId !== "all" ? selectedUserName : undefined}
        />
      </div>
    </div>
  );
};

export default AccountPerformancePage;
