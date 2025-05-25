import React, { useState, useEffect } from 'react';
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
    user, isAdmin
  } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedTab, setSelectedTab] = useState('week-plan-v2'); // Default to week-plan-v2 tab
  const isMobile = useIsMobile();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(propSelectedUserId || null);
  const [selectedUserName, setSelectedUserName] = useState<string>(propSelectedUserName || "My Data");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize state with current user or props
  useEffect(() => {
    if (propSelectedUserId) {
      setSelectedUserId(propSelectedUserId);
      setSelectedUserName(propSelectedUserName || "My Data");
      console.log('RepTracker - Using props selectedUserId:', propSelectedUserId);
    } else if (user && !selectedUserId) {
      setSelectedUserId(user.id);
      console.log('RepTracker - Using current user ID:', user.id);
    }
  }, [user, propSelectedUserId, propSelectedUserName]);

  // Update local state when props change
  useEffect(() => {
    if (propSelectedUserId !== undefined) {
      setSelectedUserId(propSelectedUserId);
      setSelectedUserName(propSelectedUserName || "My Data");
      console.log('RepTracker - Props changed, updating selectedUserId to:', propSelectedUserId);
    }
  }, [propSelectedUserId, propSelectedUserName]);

  // Console log for debugging
  useEffect(() => {
    console.log('RepTracker - Current selectedUserId:', selectedUserId);
    console.log('RepTracker - Current selectedUserName:', selectedUserName);
    console.log('RepTracker - Current user:', user);
    console.log('RepTracker - Is admin:', isAdmin);
  }, [selectedUserId, selectedUserName, user, isAdmin]);

  // Handle user selection from AppHeader
  const handleUserSelection = (userId: string | null, displayName: string) => {
    console.log(`RepTracker: User selection changed to ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };

  // Determine if user is viewing their own data
  const isViewingOwnData = selectedUserId === user?.id || selectedUserId === "all";

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

  // Modified query to exclude wholesale customers specifically on this page
  const {
    data: customers,
    isLoading: isLoadingCustomers
  } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      console.log('Fetching customers from Supabase, excluding wholesale...');
      
      const {
        data: salesData,
        error
      } = await supabase
        .from('sales_data')
        .select('account_name, account_ref, rep_type')
        .not('rep_type', 'eq', 'WHOLESALE')
        .order('account_name');
        
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      // Make sure we get unique customers by account_ref to avoid duplicates
      const uniqueCustomers = salesData.reduce((acc: any[], current) => {
        const x = acc.find(item => item.account_ref === current.account_ref);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      
      console.log(`Fetched ${salesData.length} customer records, filtered to ${uniqueCustomers.length} unique customers (excluding wholesale)`);
      
      // Sort the unique customers alphabetically to ensure consistent ordering
      uniqueCustomers.sort((a, b) => {
        return a.account_name.localeCompare(b.account_name);
      });
      
      // Log some debug information to verify we have customers at different points in the alphabet
      const firstCustomers = uniqueCustomers.slice(0, 3);
      const lastCustomers = uniqueCustomers.slice(-3);
      console.log('First few customers:', firstCustomers);
      console.log('Last few customers:', lastCustomers);
      console.log(`Total unique customers (excluding wholesale): ${uniqueCustomers.length}`);
      
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

  const handleRefresh = () => {
    setIsLoading(true);
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
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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
  
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 mt-8">
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
    </div>
  );
};

export default RepTracker;
