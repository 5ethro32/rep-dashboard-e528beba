
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, ChevronDown, Filter, RefreshCw, Star } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { AccountData, MetricsData } from '@/types/rep-performance.types';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import PerformanceTable from '@/components/rep-performance/PerformanceTable';
import { format } from 'date-fns';

// Mock data generation functions
const generateMetricsData = (baseProfit: number): MetricsData => ({
  totalOrders: Math.floor(Math.random() * 100) + 50,
  revenue: Math.floor(Math.random() * 100000) + 50000,
  margin: (Math.random() * 10) + 15,
  profit: baseProfit,
  visits: Math.floor(Math.random() * 20) + 5,
});

const generateMockAccount = (id: number, baseProfit: number): AccountData => ({
  id: `ACC${id}`,
  name: `Account ${id}`,
  representative: `Rep ${Math.floor(Math.random() * 5) + 1}`,
  type: Math.random() > 0.5 ? 'Direct' : 'Distribution',
  industry: ['Healthcare', 'Manufacturing', 'Technology', 'Retail', 'Finance'][Math.floor(Math.random() * 5)],
  location: ['East', 'West', 'Central', 'North', 'South'][Math.floor(Math.random() * 5)],
  metrics: generateMetricsData(baseProfit),
  changePercent: (Math.random() * 40) - 20,
  starred: Math.random() > 0.8,
});

const AccountPerformance = () => {
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AccountData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('All Data');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Load initial data
  useEffect(() => {
    loadAccountData();
  }, []);

  // Load account data based on selected month
  const loadAccountData = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const multiplier = selectedMonth === 'March' ? 1 : 
                        selectedMonth === 'February' ? 0.9 : 
                        selectedMonth === 'April' ? 1.12 : 1.18; // May
      
      const newAccounts = Array.from({ length: 30 }, (_, i) => 
        generateMockAccount(i + 1, Math.floor((Math.random() * 15000 + 5000) * multiplier))
      );
      
      setAccounts(newAccounts);
      setFilteredAccounts(newAccounts);
      setIsLoading(false);
    }, 800);
  };

  // Handle month selection change
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    loadAccountData();
  };

  // Filter accounts by tab selection
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredAccounts(accounts);
    } else if (activeTab === 'direct') {
      setFilteredAccounts(accounts.filter(acc => acc.type === 'Direct'));
    } else if (activeTab === 'distribution') {
      setFilteredAccounts(accounts.filter(acc => acc.type === 'Distribution'));
    } else if (activeTab === 'starred') {
      setFilteredAccounts(accounts.filter(acc => acc.starred));
    }
  }, [activeTab, accounts]);

  // Refresh data
  const handleRefresh = () => {
    setIsLoading(true);
    console.log('Refreshing account performance data');
    
    // Simulate API call delay
    setTimeout(() => {
      loadAccountData();
      toast({
        title: "Data refreshed",
        description: `Account data for ${selectedMonth} has been updated`,
        duration: 3000
      });
    }, 1200);
  };
  
  // Handle user selection
  const handleUserSelection = (userId: string | null, displayName: string) => {
    console.log(`Selected user: ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    // In a real app, this would filter the data by the selected user
  };
  
  // Page heading based on month
  const renderPageHeading = () => {
    return `Account Performance - ${selectedMonth} ${new Date().getFullYear()}`;
  };
  
  // Page description based on selected user
  const getPageDescription = () => {
    return selectedUserId && selectedUserId !== 'all'
      ? `${selectedUserName}'s account performance metrics and analysis`
      : "Overall account performance metrics and analysis";
  };

  // Calculate metrics summary
  const totalRevenue = filteredAccounts.reduce((sum, acc) => sum + acc.metrics.revenue, 0);
  const totalProfit = filteredAccounts.reduce((sum, acc) => sum + acc.metrics.profit, 0);
  const averageMargin = filteredAccounts.reduce((sum, acc) => sum + acc.metrics.margin, 0) / 
                         (filteredAccounts.length || 1);
  const totalVisits = filteredAccounts.reduce((sum, acc) => sum + acc.metrics.visits, 0);

  return (
    <AppLayout
      selectedUserId={selectedUserId}
      onSelectUser={handleUserSelection}
      showUserSelector={true}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      showChatInterface={true}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
        {/* Month dropdown, now without the refresh button */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {renderPageHeading()}
            </h1>
            <p className="text-white/60">
              {getPageDescription()}
            </p>
          </div>
          <div>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[180px] bg-gray-900/40 border-white/10">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Month" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="February">February</SelectItem>
                <SelectItem value="March">March</SelectItem>
                <SelectItem value="April">April</SelectItem>
                <SelectItem value="May">May</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Summary cards */}
        <AccountSummaryCards
          revenue={totalRevenue}
          profit={totalProfit}
          margin={averageMargin}
          visits={totalVisits}
          isLoading={isLoading}
        />
        
        {/* Account comparison */}
        <div className="my-8">
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
            <CardContent className="py-6">
              <AccountPerformanceComparison 
                accounts={filteredAccounts.slice(0, 5)} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Account list with tabs */}
        <div className="mb-8">
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Account Details</h2>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className={`${isMobile ? 'grid grid-cols-4 w-full' : ''}`}>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="direct">Direct</TabsTrigger>
                  <TabsTrigger value="distribution">Distribution</TabsTrigger>
                  <TabsTrigger value="starred">
                    <Star className="h-4 w-4 mr-1" />
                    Starred
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="p-0">
                <PerformanceTable 
                  data={filteredAccounts} 
                  isLoading={isLoading}
                  selectedMonth={selectedMonth}
                  type="account"
                />
              </TabsContent>
              
              <TabsContent value="direct" className="p-0">
                <PerformanceTable 
                  data={filteredAccounts} 
                  isLoading={isLoading}
                  selectedMonth={selectedMonth}
                  type="account"
                />
              </TabsContent>
              
              <TabsContent value="distribution" className="p-0">
                <PerformanceTable 
                  data={filteredAccounts} 
                  isLoading={isLoading}
                  selectedMonth={selectedMonth}
                  type="account"
                />
              </TabsContent>
              
              <TabsContent value="starred" className="p-0">
                <PerformanceTable 
                  data={filteredAccounts} 
                  isLoading={isLoading}
                  selectedMonth={selectedMonth}
                  type="account"
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AccountPerformance;
