
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, PlusCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import WeeklySummary from '@/components/rep-tracker/WeeklySummary';
import CustomerVisitsList from '@/components/rep-tracker/CustomerVisitsList';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useIsMobile } from '@/hooks/use-mobile';

const RepTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Calculate week start and end dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday

  // Format dates for display
  const weekStartFormatted = format(weekStart, 'EEE do MMM yy');
  const weekEndFormatted = format(weekEnd, 'EEE do MMM yy');
  
  // Fetch customers data for dropdown selection
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      // Fetch customers from sales_data or sales_data_februrary
      const { data: salesData, error } = await supabase
        .from('sales_data')
        .select('account_name, account_ref')
        .order('account_name')
        .limit(1000);
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      // Remove duplicates - only unique account_ref values
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
    // Use onSettled to handle errors correctly in tanstack/react-query v5+
    onSettled: (data, error) => {
      if (error) {
        console.error('Failed to fetch customers:', error);
        toast({
          title: 'Failed to load customers',
          description: 'Please try again later',
          variant: 'destructive'
        });
      }
    }
  });
  
  // Mock summary data - would be replaced with actual data from the database
  const summaryData = {
    totalVisits: 17,
    totalProfit: 1540.62,
    totalOrders: 12,
    conversionRate: 71,
    dailyAvgProfit: 256.77,
    avgProfitPerVisit: 90.62,
    avgProfitPerOrder: 128.39
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
        
        {/* Week Selection */}
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
        
        {/* Weekly Summary */}
        <WeeklySummary 
          data={summaryData} 
          weekStartDate={weekStart} 
          weekEndDate={weekEnd} 
        />
        
        {/* Add Visit Button */}
        <div className="flex justify-end mb-6">
          <Button 
            className="bg-finance-red hover:bg-finance-red/80"
            onClick={() => {
              // TODO: Implement add visit functionality
              toast({
                title: "Coming soon",
                description: "Add visit functionality will be implemented soon!"
              });
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Visit
          </Button>
        </div>
        
        {/* Customer Visits List */}
        <CustomerVisitsList 
          weekStartDate={weekStart} 
          weekEndDate={weekEnd}
          customers={customers || []} 
          isLoadingCustomers={isLoadingCustomers}
        />
      </div>
    </div>
  );
};

export default RepTracker;
