
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface VisitMetrics {
  totalVisits: number;
  totalProfit: number;
  totalOrders: number;
  conversionRate: number;
  dailyAvgProfit: number;
  topProfitOrder: number;
  avgProfitPerOrder: number;
  plannedVisits: number;
}

export const useVisitMetrics = (selectedDate: Date, selectedUserId?: string | null) => {
  const { user } = useAuth();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  // Use the provided userId or fall back to the current user's id
  const userId = selectedUserId || user?.id;

  return useQuery({
    queryKey: ['visit-metrics', weekStart.toISOString(), weekEnd.toISOString(), userId],
    queryFn: async (): Promise<VisitMetrics> => {
      // If we have a specific user ID, filter by that; otherwise use the current user's ID
      const visitsQuery = supabase
        .from('customer_visits')
        .select('*')
        .gte('date', weekStart.toISOString())
        .lte('date', weekEnd.toISOString());
      
      const plansQuery = supabase
        .from('week_plans')
        .select('*')
        .gte('planned_date', weekStart.toISOString().split('T')[0])
        .lte('planned_date', weekEnd.toISOString().split('T')[0]);
        
      // Apply user filter if a user ID is provided and it's not "all"
      if (userId && userId !== "all") {
        visitsQuery.eq('user_id', userId);
        plansQuery.eq('user_id', userId);
      }

      const [{ data: visits, error: visitsError }, { data: plans, error: plansError }] = await Promise.all([
        visitsQuery,
        plansQuery
      ]);

      if (visitsError) throw visitsError;
      if (plansError) throw plansError;

      // Calculate base metrics
      const totalVisits = visits.length;
      const totalProfit = visits.reduce((sum, visit) => sum + (visit.profit || 0), 0);
      const customerVisitProfit = visits
        .filter(visit => visit.visit_type === 'Customer Visit')
        .reduce((sum, visit) => sum + (visit.profit || 0), 0);
      const customerVisitCount = visits.filter(visit => visit.visit_type === 'Customer Visit').length;
      
      // Only count visits where has_order is true
      const visitsWithOrders = visits.filter(visit => visit.has_order);
      const totalOrders = visitsWithOrders.length;
      
      // Calculate order-specific profit
      const orderProfit = visitsWithOrders.reduce((sum, visit) => sum + (visit.profit || 0), 0);
      
      // Find top profit order
      const topProfitOrder = visits.length > 0 
        ? Math.max(...visits.map(visit => visit.profit || 0))
        : 0;
      
      const plannedVisits = plans.length;
      
      // Count unique days with visits to calculate daily average profit
      const uniqueVisitDays = new Set(visits.map(visit => visit.date?.split('T')[0])).size;
      const daysWithVisits = uniqueVisitDays > 0 ? uniqueVisitDays : 1; // At least 1 day to avoid division by zero
      
      // Calculate derived metrics
      const conversionRate = totalVisits ? (totalOrders / totalVisits) * 100 : 0;
      const dailyAvgProfit = totalProfit / daysWithVisits; // Calculate based on actual days with visits
      const avgProfitPerOrder = totalOrders ? orderProfit / totalOrders : 0; // Use profit specifically from orders with has_order=true

      return {
        totalVisits,
        totalProfit,
        totalOrders,
        conversionRate,
        dailyAvgProfit,
        topProfitOrder,
        avgProfitPerOrder,
        plannedVisits
      };
    },
    // Set staleTime to 0 to always re-fetch when a dependency changes
    staleTime: 0,
    // Disable any background refresh - only fetch when explicitly asked
    refetchInterval: 0,
    // Don't cache result - always re-fetch from server
    gcTime: 0
  });
};
