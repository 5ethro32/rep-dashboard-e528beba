import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Users, Eye } from 'lucide-react';
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
import AppLayout from '@/components/layout/AppLayout';

const RepTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedTab, setSelectedTab] = useState('week-plan-v2'); // Default to week-plan-v2 tab
  const isMobile = useIsMobile();
  
  // New state for selected user viewing
  const [selectedUserId, setSelectedUserId] = useState<string | null>(user?.id || null);
  const [selectedUserName, setSelectedUserName] = useState<string>("My Data");
  
  // Flag to indicate if we're viewing our own data or someone else's
  const isViewingOwnData = selectedUserId === user?.id || !selectedUserId;
  
  const queryClient = useQueryClient();
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekStartFormatted = format(weekStart, 'EEE do MMM yy');
  const weekEndFormatted = format(weekEnd, 'EEE do MMM yy');

  // Determine the user's first name for the greeting
  let userFirstName = user?.email?.split('@')[0] || 'User';
  // Capitalize first letter
  userFirstName = userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);

  // Updated to pass selectedUserId
  const { data: currentWeekMetrics, isLoading: isLoadingCurrentMetrics } = useVisitMetrics(selectedDate, selectedUserId);
  const previousWeekDate = new Date(weekStart);
  previousWeekDate.setDate(previousWeekDate.getDate() - 7);
  const { data: previousWeekMetrics } = useVisitMetrics(previousWeekDate, selectedUserId);

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data: salesData, error } = await supabase
        .from('sales_data')
        .select('account_name, account_ref')
        .order('account_name')
        .limit(1000);
      
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
  
  // Handle user selection
  const handleUserSelect = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    
    // Invalidate queries to refresh data
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
    
    queryClient.invalidateQueries({
      queryKey: ['week-plans'],
      exact: false,
      refetchType: 'all'
    });
  };

  return (
    <AppLayout
      selectedUserId={selectedUserId}
      onSelectUser={handleUserSelect}
      showChatInterface={!isMobile}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="flex justify-between items-center mb-6 pt-4">
          <Link to="/rep-performance">
            <Button variant="ghost" className="text-white hover:bg-white/10 ml-0 pl-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        {/* Modified personalized greeting - now the main heading */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isViewingOwnData ? (
              <>
                Hi, <span className="bg-gradient-to-r from-finance-red to-finance-red/80 text-transparent bg-clip-text font-bold">{userFirstName}</span>
              </>
            ) : (
              <>
                Viewing <span className="bg-gradient-to-r from-finance-red to-finance-red/80 text-transparent bg-clip-text font-bold">{selectedUserName}</span>
              </>
            )}
          </h1>
          <div className="flex items-center text-white/60">
            <p>
              {isViewingOwnData 
                ? "Track your customer visits, orders, and performance metrics." 
                : "Viewing customer visits, orders, and performance metrics."}
            </p>
            
            {!isViewingOwnData && (
              <Badge variant="outline" className="ml-2 bg-finance-red/10 border-finance-red/30 text-finance-red">
                {isMobile ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  "View Only"
                )}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-finance-red shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold truncate">
              Week: {weekStartFormatted} - {weekEndFormatted}
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={() => {
                setSelectedDate(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
              }}
            >
              Previous
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={() => {
                setSelectedDate(new Date());
              }}
            >
              Current
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={() => {
                setSelectedDate(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000));
              }}
            >
              Next
            </Button>
          </div>
        </div>
        
        <WeeklySummary 
          data={currentWeekMetrics || {
            totalVisits: 0,
            totalProfit: 0,
            totalOrders: 0,
            conversionRate: 0,
            dailyAvgProfit: 0,
            topProfitOrder: 0,
            avgProfitPerOrder: 0,
            plannedVisits: 0
          }}
          previousData={previousWeekMetrics}
          weekStartDate={weekStart} 
          weekEndDate={weekEnd}
          isLoading={isLoadingCurrentMetrics}
        />
        
        <Tabs 
          value={selectedTab} 
          onValueChange={setSelectedTab} 
          className="space-y-6"
        >
          <TabsList className="bg-black/20 border-gray-800">
            <TabsTrigger value="week-plan-v2">Week Plan</TabsTrigger>
            <TabsTrigger value="visits">Customer Visits</TabsTrigger>
            <TabsTrigger value="customer-history">Customer History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="week-plan-v2" className="mt-6">
            {isMobile ? (
              <ScrollArea className="h-[calc(100vh-380px)]">
                <WeekPlanTabV2 
                  weekStartDate={weekStart}
                  weekEndDate={weekEnd}
                  customers={customers || []}
                  onAddPlanSuccess={handleAddPlanSuccess}
                  selectedUserId={selectedUserId}
                  isViewingOwnData={isViewingOwnData}
                />
              </ScrollArea>
            ) : (
              <WeekPlanTabV2 
                weekStartDate={weekStart}
                weekEndDate={weekEnd}
                customers={customers || []}
                onAddPlanSuccess={handleAddPlanSuccess}
                selectedUserId={selectedUserId}
                isViewingOwnData={isViewingOwnData}
              />
            )}
          </TabsContent>
          
          <TabsContent value="visits" className="mt-6">
            <CustomerVisitsList 
              weekStartDate={weekStart} 
              weekEndDate={weekEnd}
              customers={customers || []} 
              isLoadingCustomers={isLoadingCustomers}
              onDataChange={handleDataChange}
              onAddVisit={() => setShowAddVisit(true)}
              selectedUserId={selectedUserId}
              isViewingOwnData={isViewingOwnData}
            />
          </TabsContent>
          
          <TabsContent value="customer-history" className="mt-6">
            <CustomerHistoryTable 
              customers={customers || []}
              selectedUserId={selectedUserId}
            />
          </TabsContent>
        </Tabs>
        
        {showAddVisit && isViewingOwnData && (
          <AddVisitDialog
            isOpen={showAddVisit}
            onClose={() => setShowAddVisit(false)}
            onSuccess={handleAddVisitSuccess}
            customers={customers || []}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default RepTracker;
