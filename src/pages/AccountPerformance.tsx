
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, BarChart2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserProfileButton from '@/components/auth/UserProfileButton';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';

const AccountPerformance = () => {
  const {
    currentMonthData,
    previousMonthData,
    isLoading,
    selectedMonth,
    formatCurrency
  } = useRepPerformanceData();
  
  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex justify-end pt-4">
          <UserProfileButton />
        </div>
        
        <h1 className="text-3xl font-bold mt-6 mb-8">Account Performance</h1>
        
        <div className="flex gap-3 mb-6">
          <Link to="/rep-performance">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Rep Performance
            </Button>
          </Link>
          
          <Link to="/vera-ai">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              VeraAI Chat
            </Button>
          </Link>
        </div>
        
        <div className="space-y-6">
          <AccountPerformanceComparison 
            currentMonthData={currentMonthData}
            previousMonthData={previousMonthData}
            isLoading={isLoading}
            selectedMonth={selectedMonth}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountPerformance;
