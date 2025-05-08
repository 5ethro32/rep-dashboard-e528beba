import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Eye } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import WeeklySummary from '@/components/rep-tracker/WeeklySummary';
import CustomerVisitsList from '@/components/rep-tracker/CustomerVisitsList';
import WeekPlanTabV2 from '@/components/rep-tracker/WeekPlanTabV2';
import { useVisitMetrics } from '@/hooks/useVisitMetrics';
import { toast } from '@/components/ui/use-toast';
import AddVisitDialog from '@/components/rep-tracker/AddVisitDialog';
import CustomerHistoryTable from '@/components/rep-tracker/CustomerHistoryTable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
interface RepTrackerProps {
  selectedUserId?: string | null;
  selectedUserName?: string;
}
const RepTracker: React.FC<RepTrackerProps> = ({
  selectedUserId: propSelectedUserId,
  selectedUserName: propSelectedUserName
}) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedTab, setSelectedTab] = useState('week-plan-v2'); // Default to week-plan-v2 tab
  const isMobile = useIsMobile();

  // Initialize with props if provided, otherwise use the current user
  const selectedUserId = propSelectedUserId || user?.id;

  // Determine if user is viewing their own data
  const isViewingOwnData = selectedUserId === user?.id || selectedUserId === "all";

  // Get the user's display name
  const selectedUserName = propSelectedUserName || "My Data";
  const queryClient = useQueryClient();
  const weekStart = startOfWeek(selectedDate, {
    weekStartsOn: 1
  });
  const weekEnd = endOfWeek(selectedDate, {
    weekStartsOn: 1
  });
  const weekStartFormatted = format(weekStart, 'EEE do MMM yy');
  const weekEndFormatted = format(weekEnd, 'EEE do MMM yy');

  // Determine the user's first name for the greeting
  let userFirstName = user?.email?.split('@')[0] || 'User';
  // Capitalize first letter
  userFirstName = userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);

  // Updated to pass selectedUserId
  const {
    data: currentWeekMetrics,
    isLoading: isLoadingCurrentMetrics
  } = useVisitMetrics(selectedDate, selectedUserId);
  const previousWeekDate = new Date(weekStart);
  previousWeekDate.setDate(previousWeekDate.getDate() - 7);
  const {
    data: previousWeekMetrics
  } = useVisitMetrics(previousWeekDate, selectedUserId);
  const {
    data: customers,
    isLoading: isLoadingCustomers
  } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const {
        data: salesData,
        error
      } = await supabase.from('sales_data').select('account_name, account_ref').order('account_name').limit(1000);
      if (error) {
        throw error;
      }
      const uniqueCustomers = salesData.reduce((acc: any[], current) => {
        const x = acc.find(item => item.account_ref === current.account_ref);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      return uniqueCustomers;
    },
    meta: {
      onError: (error: Error) => {
        console.error('Failed to fetch customers:', error);
        toast({
          title: 'Failed to load customers',
          description: 'Please try again later',
          variant: 'destructive'
        });
      }
    }
  });

  // Helper function to generate heading with white text
  const renderPageHeading = () => {
    if (selectedUserId === "all") {
      return <h1 className="text-3xl font-bold text-white mb-2 md:text-3xl">
          Aver's Planner
        </h1>;
    } else {
      // Extract first name
      const firstName = selectedUserName === 'My Data' ? 'My' : selectedUserName.split(' ')[0];

      // Add apostrophe only if it's not "My"
      const displayName = firstName === 'My' ? 'My' : `${firstName}'s`;
      return <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {displayName} Planner
        </h1>;
    }
  };
  const handleAddVisitSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['visit-metrics'],
      exact: false,
      refetchType: 'all'
    });
    queryClient.invalidateQueries({
      queryKey: ['customer-visits'],
      exact: false,
      refetchType: 'all'
    });
    setShowAddVisit(false);
  };
  const handleDataChange = () => {
    queryClient.invalidateQueries({
      queryKey: ['visit-metrics'],
      exact: false,
      refetchType: 'all'
    });
  };
  const handleAddPlanSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['visit-metrics'],
      exact: false,
      refetchType: 'all'
    });
    setSelectedTab('week-plan-v2');
  };
  return <div className="container max-w-7xl mx-auto px-4 md:px-6 pb-16">
      <div className="mb-6 pt-8">
        {renderPageHeading()}
        <p className="text-white/60">
          {selectedUserId === "all" ? "Track Aver's visits and plan customer interactions across the team." : selectedUserName && selectedUserName !== 'My Data' ? `Track ${selectedUserName.split(' ')[0]}'s visits and plan customer interactions.` : "Track your visits and plan your customer interactions."}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-finance-red shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold truncate">
            {selectedUserId !== "all" && selectedUserId !== user?.id ? `${selectedUserName.split(' ')[0]}'s ` : ""} 
            Week: {weekStartFormatted} - {weekEndFormatted}
          </h2>
        </div>
        
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => {
          setSelectedDate(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
        }}>
            Previous
          </Button>
          
          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => {
          setSelectedDate(new Date());
        }}>
            Current
          </Button>
          
          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => {
          setSelectedDate(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000));
        }}>
            Next
          </Button>
        </div>
      </div>
      
      <WeeklySummary data={currentWeekMetrics || {
      totalVisits: 0,
      totalProfit: 0,
      totalOrders: 0,
      conversionRate: 0,
      dailyAvgProfit: 0,
      topProfitOrder: 0,
      avgProfitPerOrder: 0,
      plannedVisits: 0
    }} previousData={previousWeekMetrics} weekStartDate={weekStart} weekEndDate={weekEnd} isLoading={isLoadingCurrentMetrics} />
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-black/20 border-gray-800">
          <TabsTrigger value="week-plan-v2">Week Plan</TabsTrigger>
          <TabsTrigger value="visits">Customer Visits</TabsTrigger>
          <TabsTrigger value="customer-history">Customer History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="week-plan-v2" className="mt-6">
          {isMobile ? <ScrollArea className="h-[calc(100vh-380px)]">
              <WeekPlanTabV2 weekStartDate={weekStart} weekEndDate={weekEnd} customers={customers || []} onAddPlanSuccess={handleAddPlanSuccess} selectedUserId={selectedUserId} isViewingOwnData={isViewingOwnData} />
            </ScrollArea> : <WeekPlanTabV2 weekStartDate={weekStart} weekEndDate={weekEnd} customers={customers || []} onAddPlanSuccess={handleAddPlanSuccess} selectedUserId={selectedUserId} isViewingOwnData={isViewingOwnData} />}
        </TabsContent>
        
        <TabsContent value="visits" className="mt-6">
          <CustomerVisitsList weekStartDate={weekStart} weekEndDate={weekEnd} customers={customers || []} isLoadingCustomers={isLoadingCustomers} onDataChange={handleDataChange} onAddVisit={() => setShowAddVisit(true)} selectedUserId={selectedUserId} isViewingOwnData={isViewingOwnData} />
        </TabsContent>
        
        <TabsContent value="customer-history" className="mt-6">
          <CustomerHistoryTable customers={customers || []} selectedUserId={selectedUserId} />
        </TabsContent>
      </Tabs>
      
      {showAddVisit && isViewingOwnData && <AddVisitDialog isOpen={showAddVisit} onClose={() => setShowAddVisit(false)} onSuccess={handleAddVisitSuccess} customers={customers || []} />}
    </div>;
};
export default RepTracker;
