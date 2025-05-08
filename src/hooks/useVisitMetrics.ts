
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek } from 'date-fns';
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
      // Get dates in ISO format without time component for proper database comparison
      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];

      // If we have a specific user ID, filter by that; otherwise use the current user's ID
      const visitsQuery = supabase
        .from('customer_visits')
        .select('*')
        .gte('date', weekStart.toISOString())
        .lte('date', weekEnd.toISOString());
      
      const plansQuery = supabase
        .from('week_plans') // Fixed table name: 'week_plans'
        .select('*')
        .gte('planned_date', startDateStr)
        .lte('planned_date', endDateStr);
        
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

      // Default to empty arrays if data is null
      const safeVisits = visits || [];
      const safePlans = plans || [];

      // Calculate base metrics
      const totalVisits = safeVisits.length;
      const totalProfit = safeVisits.reduce((sum, visit) => sum + (visit.profit || 0), 0);
      const customerVisitProfit = safeVisits
        .filter(visit => visit.visit_type === 'Customer Visit')
        .reduce((sum, visit) => sum + (visit.profit || 0), 0);
      const customerVisitCount = safeVisits.filter(visit => visit.visit_type === 'Customer Visit').length;
      
      // Only count visits where has_order is true
      const visitsWithOrders = safeVisits.filter(visit => visit.has_order);
      const totalOrders = visitsWithOrders.length;
      
      // Calculate order-specific profit
      const orderProfit = visitsWithOrders.reduce((sum, visit) => sum + (visit.profit || 0), 0);
      
      // Find top profit order
      const topProfitOrder = safeVisits.length > 0 
        ? Math.max(...safeVisits.map(visit => visit.profit || 0))
        : 0;
      
      const plannedVisits = safePlans.length;
      
      // Count unique days with visits to calculate daily average profit
      const uniqueVisitDays = new Set(safeVisits.map(visit => 
        visit.date ? visit.date.toString().split('T')[0] : ''
      )).size;
      
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
    staleTime: 0,
    refetchInterval: 0,
    gcTime: 0
  });
};
