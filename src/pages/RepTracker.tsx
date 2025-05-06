
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import WeeklySummary from '@/components/rep-tracker/WeeklySummary';
import CustomerVisitsList from '@/components/rep-tracker/CustomerVisitsList';
import WeekPlanTabV2 from '@/components/rep-tracker/WeekPlanTabV2';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useVisitMetrics } from '@/hooks/useVisitMetrics';
import { toast } from '@/components/ui/use-toast';
import AddVisitDialog from '@/components/rep-tracker/AddVisitDialog';
import CustomerHistoryTable from '@/components/rep-tracker/CustomerHistoryTable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const RepTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedTab, setSelectedTab] = useState('week-plan-v2'); // Default to week-plan-v2 tab
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const queryClient = useQueryClient();
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekStartFormatted = format(weekStart, 'EEE do MMM yy');
  const weekEndFormatted = format(weekEnd, 'EEE do MMM yy');

  // Determine the user's first name for the greeting
  let userFirstName = user?.email?.split('@')[0] || 'User';
  // Capitalize first letter
  userFirstName = userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);

  // Get all users for admin selector (admins only)
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin, // Only run this query if user is admin
    meta: {
      onError: (error: Error) => {
        console.error('Error loading users:', error);
      }
    }
  });

  const { data: currentWeekMetrics, isLoading: isLoadingCurrentMetrics } = useVisitMetrics(selectedDate, selectedUser);
  const previousWeekDate = new Date(weekStart);
  previousWeekDate.setDate(previousWeekDate.getDate() - 7);
  const { data: previousWeekMetrics } = useVisitMetrics(previousWeekDate, selectedUser);

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

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId === 'all' ? null : userId);
    // Reset the invalidate metrics queries to load the new user's data
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
  };

  // Format user name for display
  const formatUserName = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "Unknown User";
    return [firstName, lastName].filter(Boolean).join(" ");
  };

  // Get the current user name to display (for viewing another rep's data)
  const getCurrentViewName = () => {
    if (!selectedUser) return userFirstName; // Default to current user
    
    if (isLoadingUsers || !allUsers) return "Loading...";
    
    const selectedUserData = allUsers.find(u => u.id === selectedUser);
    return selectedUserData ? 
      formatUserName(selectedUserData.first_name, selectedUserData.last_name) : 
      "Selected Rep";
  };

  const viewingAnotherUser = isAdmin && selectedUser && selectedUser !== user?.id;

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pb-16">
      <div className="flex justify-between items-center mb-6 pt-4">
        <Link to="/rep-performance">
          <Button variant="ghost" className="text-white hover:bg-white/10 ml-0 pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <UserProfileButton />
      </div>
      
      {/* Enhanced personalized greeting with user selection for admins */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Hi, <span className="bg-gradient-to-r from-finance-red to-finance-red/80 text-transparent bg-clip-text font-bold">{userFirstName}</span>
          </h1>
          
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-finance-red" />
              <span className="text-sm text-white/60">View colleague data:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-black/30 border-gray-700 text-white hover:bg-black/50"
                    size="sm"
                  >
                    {selectedUser ? getCurrentViewName() : "My Activity"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-800 text-white">
                  <DropdownMenuLabel>Select Rep</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <div className="max-h-[300px] overflow-y-auto">
                    <SelectContent className="bg-gray-900 border-0">
                      <SelectItem value="all" className="text-white hover:bg-gray-800 cursor-pointer py-2 px-4" onClick={() => handleUserChange('all')}>
                        All Reps
                      </SelectItem>
                      <SelectItem value={user?.id || ''} className="text-white hover:bg-gray-800 cursor-pointer py-2 px-4" onClick={() => handleUserChange(user?.id || '')}>
                        My Activity
                      </SelectItem>
                      {allUsers?.map((u) => (
                        <SelectItem 
                          key={u.id} 
                          value={u.id} 
                          className="text-white hover:bg-gray-800 cursor-pointer py-2 px-4"
                          onClick={() => handleUserChange(u.id)}
                        >
                          {formatUserName(u.first_name, u.last_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <p className="text-white/60">
          {viewingAnotherUser ? (
            `Viewing ${getCurrentViewName()}'s customer visits, orders, and performance metrics.`
          ) : (
            `Track your customer visits, orders, and performance metrics.`
          )}
        </p>
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
                userId={selectedUser}
              />
            </ScrollArea>
          ) : (
            <WeekPlanTabV2 
              weekStartDate={weekStart}
              weekEndDate={weekEnd}
              customers={customers || []}
              onAddPlanSuccess={handleAddPlanSuccess}
              userId={selectedUser}
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
            userId={selectedUser}
            isAdmin={isAdmin}
          />
        </TabsContent>
        
        <TabsContent value="customer-history" className="mt-6">
          <CustomerHistoryTable 
            customers={customers || []}
            userId={selectedUser} 
          />
        </TabsContent>
      </Tabs>
      
      {showAddVisit && (
        <AddVisitDialog
          isOpen={showAddVisit}
          onClose={() => setShowAddVisit(false)}
          onSuccess={handleAddVisitSuccess}
          customers={customers || []}
          userId={selectedUser}
        />
      )}
    </div>
  );
};

export default RepTracker;
