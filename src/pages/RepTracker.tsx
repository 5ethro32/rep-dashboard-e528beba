import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, PlusCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import WeeklySummary from '@/components/rep-tracker/WeeklySummary';
import CustomerVisitsList from '@/components/rep-tracker/CustomerVisitsList';
import WeekPlanTab from '@/components/rep-tracker/WeekPlanTab';
import AddVisitDialog from '@/components/rep-tracker/AddVisitDialog';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useVisitMetrics } from '@/hooks/useVisitMetrics';

const RepTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedTab, setSelectedTab] = useState('visits');
  
  const queryClient = useQueryClient();
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekStartFormatted = format(weekStart, 'EEE do MMM yy');
  const weekEndFormatted = format(weekEnd, 'EEE do MMM yy');

  const { data: currentWeekMetrics, isLoading: isLoadingCurrentMetrics } = useVisitMetrics(selectedDate);
  const previousWeekDate = new Date(weekStart);
  previousWeekDate.setDate(previousWeekDate.getDate() - 7);
  const { data: previousWeekMetrics } = useVisitMetrics(previousWeekDate);

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
    
    setSelectedTab('visits');
    setShowAddVisit(false);
  };

  const handleDataChange = () => {
    queryClient.invalidateQueries({
      queryKey: ['visit-metrics'],
      exact: false,
      refetchType: 'all'
    });
  };

  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
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
        
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Rep Tracker</h1>
          <p className="text-white/60">
            Track your customer visits, orders, and performance metrics.
          </p>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-finance-red" />
            <h2 className="text-lg font-semibold">
              Week: {weekStartFormatted} - {weekEndFormatted}
            </h2>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedDate(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
              }}
            >
              Previous Week
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedDate(new Date());
              }}
            >
              Current Week
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedDate(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000));
              }}
            >
              Next Week
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
            avgProfitPerVisit: 0,
            avgProfitPerOrder: 0
          }}
          previousData={previousWeekMetrics}
          weekStartDate={weekStart} 
          weekEndDate={weekEnd}
          isLoading={isLoadingCurrentMetrics}
        />
        
        <div className="flex justify-end mb-6">
          <Button 
            className="bg-finance-red hover:bg-finance-red/80"
            onClick={() => setShowAddVisit(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Visit
          </Button>
        </div>
        
        <Tabs 
          value={selectedTab} 
          onValueChange={setSelectedTab} 
          className="space-y-6"
        >
          <TabsList className="bg-black/20 border-gray-800">
            <TabsTrigger value="visits">Customer Visits</TabsTrigger>
            <TabsTrigger value="week-plan">Week Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visits" className="mt-6">
            <CustomerVisitsList 
              weekStartDate={weekStart} 
              weekEndDate={weekEnd}
              customers={customers || []} 
              isLoadingCustomers={isLoadingCustomers}
              onDataChange={handleDataChange}
            />
          </TabsContent>
          
          <TabsContent value="week-plan" className="mt-6">
            <WeekPlanTab 
              weekStartDate={weekStart}
              weekEndDate={weekEnd}
              customers={customers || []}
            />
          </TabsContent>
        </Tabs>
        
        <AddVisitDialog 
          isOpen={showAddVisit}
          onClose={() => setShowAddVisit(false)}
          onSuccess={handleAddVisitSuccess}
          customers={customers || []}
        />
      </div>
    </div>
  );
};

export default RepTracker;
