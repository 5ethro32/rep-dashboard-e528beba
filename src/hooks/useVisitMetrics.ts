
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, differenceInDays } from 'date-fns';

interface VisitMetrics {
  totalVisits: number;
  totalProfit: number;
  totalOrders: number;
  conversionRate: number;
  dailyAvgProfit: number;
  avgProfitPerVisit: number;
  avgProfitPerOrder: number;
}

export const useVisitMetrics = (selectedDate: Date) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ['visit-metrics', weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async (): Promise<VisitMetrics> => {
      const { data: visits, error } = await supabase
        .from('customer_visits')
        .select('*')
        .gte('date', weekStart.toISOString())
        .lte('date', weekEnd.toISOString());

      if (error) throw error;

      // Calculate base metrics
      const totalVisits = visits.length;
      const totalProfit = visits.reduce((sum, visit) => sum + (visit.profit || 0), 0);
      const totalOrders = visits.filter(visit => visit.has_order).length;
      
      // Calculate derived metrics
      const conversionRate = totalVisits ? (totalOrders / totalVisits) * 100 : 0;
      const daysInRange = differenceInDays(weekEnd, weekStart) + 1;
      const dailyAvgProfit = daysInRange ? totalProfit / daysInRange : 0;
      const avgProfitPerVisit = totalVisits ? totalProfit / totalVisits : 0;
      const avgProfitPerOrder = totalOrders ? totalProfit / totalOrders : 0;

      return {
        totalVisits,
        totalProfit,
        totalOrders,
        conversionRate,
        dailyAvgProfit,
        avgProfitPerVisit,
        avgProfitPerOrder
      };
    },
    staleTime: 0, // Consider data stale immediately
    refetchInterval: 0 // Don't automatically refetch
  });
};
