
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export interface VisitMetrics {
  totalVisits: number;
  totalOrders: number;
  totalProfit: number;
  dailyAvgProfit: number;
  conversionRate: number;
  topProfitOrder: number;
  avgProfitPerOrder: number;
  plannedVisits: number;
}

export const useVisitMetrics = (date: Date, userId?: string | null) => {
  const { user } = useAuth();
  
  // The date range for the query is the week starting from the provided date
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  return useQuery({
    queryKey: ['visit-metrics', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'), userId],
    queryFn: async () => {
      // Use the provided userId or fall back to the logged-in user's ID
      const queryUserId = userId !== undefined ? userId : user?.id;
      
      let query = supabase
        .from('customer_visits')
        .select('*')
        .gte('date', weekStart.toISOString())
        .lte('date', weekEnd.toISOString());
      
      // Only filter by user_id if we have one (allows for viewing all users)
      if (queryUserId) {
        query = query.eq('user_id', queryUserId);
      }
      
      const { data: visits, error } = await query;
      
      if (error) throw error;
      
      // Query for week plans
      let plansQuery = supabase
        .from('week_plans')
        .select('*')
        .gte('planned_date', weekStart.toISOString().split('T')[0])
        .lte('planned_date', weekEnd.toISOString().split('T')[0]);
        
      // Only filter by user_id if we have one
      if (queryUserId) {
        plansQuery = plansQuery.eq('user_id', queryUserId);
      }
        
      const { data: plans, error: plansError } = await plansQuery;
      
      if (plansError) throw plansError;
      
      const orderVisits = visits ? visits.filter(visit => visit.has_order) : [];
      
      const totalVisits = visits ? visits.length : 0;
      const totalOrders = orderVisits.length;
      const totalProfit = orderVisits.reduce((sum, visit) => sum + (visit.profit || 0), 0);
      const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
      const topProfitOrder = orderVisits.length > 0 ? Math.max(...orderVisits.map(v => v.profit || 0)) : 0;
      const avgProfitPerOrder = totalOrders > 0 ? totalProfit / totalOrders : 0;
      const plannedVisits = plans ? plans.length : 0;
      
      // Calculate average daily profit
      let dailyProfitTotal = 0;
      let daysWithProfit = 0;
      
      // Create a map of daily profit totals
      const dailyProfits = new Map();
      
      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(weekStart, i);
        const dayFormatted = format(currentDay, 'yyyy-MM-dd');
        
        const dayVisits = orderVisits.filter(visit => {
          const visitDate = new Date(visit.date);
          return format(visitDate, 'yyyy-MM-dd') === dayFormatted;
        });
        
        const dayProfit = dayVisits.reduce((sum, visit) => sum + (visit.profit || 0), 0);
        dailyProfits.set(dayFormatted, dayProfit);
        
        if (dayProfit > 0) {
          dailyProfitTotal += dayProfit;
          daysWithProfit++;
        }
      }
      
      const dailyAvgProfit = daysWithProfit > 0 ? dailyProfitTotal / daysWithProfit : 0;
      
      return {
        totalVisits,
        totalOrders,
        totalProfit,
        conversionRate,
        dailyAvgProfit,
        topProfitOrder,
        avgProfitPerOrder,
        plannedVisits
      };
    },
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching visit metrics:', error);
      }
    }
  });
};
