
import React, { useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import CustomerSelector from '@/components/rep-tracker/CustomerSelector';
import CustomerVisitsList from '@/components/rep-tracker/CustomerVisitsList';
import CustomerSearch from '@/components/rep-tracker/CustomerSearch';
import WeekPlanTabV2 from '@/components/rep-tracker/WeekPlanTabV2';
import WeeklySummary from '@/components/rep-tracker/WeeklySummary';
import { useIsMobile } from '@/hooks/use-mobile';

const RepTracker = () => {
  const [selectedTab, setSelectedTab] = useState('planner');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('All Data');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSelectCustomer = (customerId: string | null, customerName: string) => {
    console.log(`Selected customer: ${customerName} (${customerId})`);
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
  };
  
  const handleSelectUser = (userId: string | null, displayName: string) => {
    console.log(`Selected rep: ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };
  
  const handleRefresh = async () => {
    console.log('Refreshing Rep Tracker data');
    setIsLoading(true);
    
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      toast({
        title: "Data refreshed",
        description: "Rep tracker data has been updated",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was a problem refreshing the data",
        variant: "destructive"
      });
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout 
      showChatInterface={true} 
      selectedUserId={selectedUserId}
      onSelectUser={handleSelectUser}
      showUserSelector={true}
      onRefresh={handleRefresh}
      isLoading={isLoading}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Rep Planner</h1>
              <p className="text-white/60">Manage customer visits and weekly planning</p>
            </div>
          </div>
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className={isMobile ? "w-full grid grid-cols-2" : ""}>
            <TabsTrigger value="planner">Weekly Planner</TabsTrigger>
            <TabsTrigger value="customers">Customer Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="planner" className="mt-6">
            <div className="grid gap-6">
              <WeekPlanTabV2 
                selectedUserId={selectedUserId} 
                selectedUserName={selectedUserName} 
              />
              <WeeklySummary 
                selectedUserId={selectedUserId} 
                selectedUserName={selectedUserName} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="customers" className="mt-6">
            <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="grid gap-6">
                  <CustomerSearch />
                  <Separator className="bg-white/10" />
                  <CustomerSelector 
                    selectedCustomerId={selectedCustomerId} 
                    onSelectCustomer={handleSelectCustomer} 
                  />
                  <Separator className="bg-white/10" />
                  <CustomerVisitsList 
                    customerId={selectedCustomerId} 
                    customerName={selectedCustomerName} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default RepTracker;
