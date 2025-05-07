import React, { useState } from 'react';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import UserSelector from '@/components/rep-tracker/UserSelector';
import { useAuth } from '@/contexts/AuthContext';

const sampleData = [
  {
    accountName: 'Account A',
    currentMonth: {
      profit: 50000,
      orders: 120,
      visits: 30,
    },
    previousMonth: {
      profit: 45000,
      orders: 110,
      visits: 28,
    },
  },
  {
    accountName: 'Account B',
    currentMonth: {
      profit: 60000,
      orders: 150,
      visits: 35,
    },
    previousMonth: {
      profit: 55000,
      orders: 140,
      visits: 33,
    },
  },
  {
    accountName: 'Account C',
    currentMonth: {
      profit: 40000,
      orders: 100,
      visits: 25,
    },
    previousMonth: {
      profit: 38000,
      orders: 95,
      visits: 23,
    },
  },
];

const mockDataGenerator = (count: number) => {
  const data = [];
  for (let i = 1; i <= count; i++) {
    data.push({
      accountName: `Account ${i}`,
      currentMonth: {
        profit: Math.floor(Math.random() * 100000),
        orders: Math.floor(Math.random() * 200),
        visits: Math.floor(Math.random() * 50),
      },
      previousMonth: {
        profit: Math.floor(Math.random() * 90000),
        orders: Math.floor(Math.random() * 180),
        visits: Math.floor(Math.random() * 45),
      },
    });
  }
  return data;
};

const AccountPerformance = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("All Accounts");
  const [accountData, setAccountData] = useState(mockDataGenerator(5));
  const { user } = useAuth();

  const handleUserSelect = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    
    // Mock implementation: Filter data based on user selection
    if (userId) {
      // In a real scenario, you would fetch data from the server
      // Here, we simulate filtering by creating new data
      setAccountData(mockDataGenerator(5));
    } else {
      // Reset to all accounts
      setAccountData(mockDataGenerator(5));
    }
  };
  
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      <div className="flex justify-end items-center pt-4">
        <div className="flex items-center gap-3">
          <UserSelector 
            selectedUserId={selectedUserId} 
            onSelectUser={handleUserSelect}
          />
        </div>
      </div>
      
      <PerformanceHeader 
        selectedMonth="March"
        setSelectedMonth={() => {}}
      />
      
      <AccountSummaryCards 
        accountData={accountData}
        formatCurrency={formatCurrency}
      />
      
      <AccountPerformanceComparison 
        accountData={accountData}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default AccountPerformance;
