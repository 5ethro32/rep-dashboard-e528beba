
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, differenceInDays } from 'date-fns';

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

export const useVisitMetrics = (selectedDate: Date) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ['visit-metrics', weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async (): Promise<VisitMetrics> => {
      const [{ data: visits, error: visitsError }, { data: plans, error: plansError }] = await Promise.all([
        supabase
          .from('customer_visits')
          .select('*')
          .gte('date', weekStart.toISOString())
          .lte('date', weekEnd.toISOString()),
        supabase
          .from('week_plans')
          .select('*')
          .gte('planned_date', weekStart.toISOString().split('T')[0])
          .lte('planned_date', weekEnd.toISOString().split('T')[0])
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
    staleTime: 0,
    refetchInterval: 0
  });
};
