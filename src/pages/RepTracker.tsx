import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CustomerHistoryTable from '@/components/rep-tracker/CustomerHistoryTable';
import WeekPlanTabV2 from '@/components/rep-tracker/WeekPlanTabV2';
import WeeklySummary from '@/components/rep-tracker/WeeklySummary';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useVisitMetrics } from '@/hooks/useVisitMetrics';

interface RepTrackerProps {
  selectedUserId?: string | null;
  selectedUserName?: string;
}

const RepTracker: React.FC<RepTrackerProps> = ({ 
  selectedUserId: propSelectedUserId, 
  selectedUserName: propSelectedUserName 
}) => {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('My Data');
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [weekPlan, setWeekPlan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { totalPlannedVisits, totalCompletedVisits } = useVisitMetrics(weekPlan);
  
  useEffect(() => {
    if (propSelectedUserId) {
      setSelectedUserId(propSelectedUserId);
      setDisplayName(propSelectedUserName || "My Data");
    } else if (user && !selectedUserId) {
      setSelectedUserId(user.id);
      setDisplayName("My Data");
    }
  }, [user, propSelectedUserId, propSelectedUserName]);
  
  useEffect(() => {
    if (selectedUserId) {
      fetchCustomerHistory();
      fetchWeekPlan();
    }
  }, [selectedUserId]);
  
  const fetchCustomerHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_visits')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching customer history:", error);
      } else {
        setCustomerHistory(data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchWeekPlan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('week_plan')
        .select('*')
        .eq('user_id', selectedUserId);
      
      if (error) {
        console.error("Error fetching week plan:", error);
      } else {
        setWeekPlan(data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    await fetchCustomerHistory();
    await fetchWeekPlan();
  };
  
  const handleSelectUser = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setDisplayName(displayName);
    setIsLoading(true);
  };
  
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent">
      <div className="mb-6 pt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-700 to-finance-red">
            {selectedUserId === user?.id ? "My" : selectedUserId === "all" ? "Team" : displayName}
          </span>{' '}
          Tracker
        </h1>
        <p className="text-white/60">
          {selectedUserId === user?.id 
            ? "Track your customer visits and schedule future appointments" 
            : selectedUserId === "all" 
              ? "Track team customer visits and scheduled appointments" 
              : `Track ${displayName}'s customer visits and scheduled appointments`}
        </p>
      </div>
      
      <Tabs defaultValue="history" className="w-full">
        <TabsList className={`${isMobile ? 'flex flex-wrap' : 'grid grid-cols-2'} mb-4 md:mb-6 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/5 shadow-lg p-1`}>
          <TabsTrigger value="history" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
            Customer History
          </TabsTrigger>
          <TabsTrigger value="weekplan" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
            Week Plan
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-0">
          <CustomerHistoryTable 
            customerHistory={customerHistory} 
            isLoading={isLoading} 
            onRefresh={handleRefresh} 
          />
        </TabsContent>
        
        <TabsContent value="weekplan" className="mt-0">
          <WeekPlanTabV2 
            weekPlan={weekPlan} 
            isLoading={isLoading} 
            onRefresh={handleRefresh} 
          />
          <WeeklySummary 
            totalPlannedVisits={totalPlannedVisits}
            totalCompletedVisits={totalCompletedVisits}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RepTracker;
