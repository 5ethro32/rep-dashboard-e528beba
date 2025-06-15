import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, Users, Calendar, TrendingUp, FileText, User, MapPin } from 'lucide-react';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/utils/rep-performance-utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerVisit {
  id: string;
  date: string;
  customer_name: string;
  customer_ref: string;
  visit_type: string;
  has_order: boolean;
  profit: number;
  comments: string | null;
  contact_name: string | null;
}

interface CustomerHistoryTableProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  selectedUserId?: string | null;  // New prop for selected user
}

const CustomerHistoryTable: React.FC<CustomerHistoryTableProps> = ({
  customers,
  selectedUserId
}) => {
  const [selectedCustomerRef, setSelectedCustomerRef] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Use the provided userId or fall back to the current user's id
  const userId = selectedUserId || user?.id;

  // Query to fetch all visits for a specific customer
  const { data: customerVisits, isLoading } = useQuery({
    queryKey: ['customer-history', selectedCustomerRef, userId],
    queryFn: async (): Promise<CustomerVisit[]> => {
      if (!selectedCustomerRef) return [];
      
      const query = supabase
        .from('customer_visits')
        .select('*')
        .eq('customer_ref', selectedCustomerRef);
        
      // Only filter by user_id if we have a selected user
      if (userId) {
        query.eq('user_id', userId);
      }
      
      query.order('date', { ascending: false });
        
      const { data, error } = await query;
        
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedCustomerRef
  });

  const handleCustomerSelect = (ref: string, name: string) => {
    setSelectedCustomerRef(ref);
    setSelectedCustomerName(name);
  };

  // Function to format the date for display
  const formatVisitDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEE, MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Calculate summary statistics for the selected customer
  const customerStats = customerVisits ? {
    totalVisits: customerVisits.length,
    totalOrders: customerVisits.filter(v => v.has_order).length,
    totalProfit: customerVisits.reduce((sum, v) => sum + (v.profit || 0), 0),
    conversionRate: customerVisits.length > 0 ? 
      (customerVisits.filter(v => v.has_order).length / customerVisits.length) * 100 : 0,
    avgProfitPerVisit: customerVisits.length > 0 ? 
      customerVisits.reduce((sum, v) => sum + (v.profit || 0), 0) / customerVisits.length : 0
  } : null;

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-finance-red" />
            <h3 className="text-xl font-bold text-white">Customer Visit History</h3>
          </div>
          <p className="text-sm text-gray-400">
            View comprehensive visit history and performance metrics for any customer
          </p>
        </div>
        
        {/* Customer Counter Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-finance-red border-finance-red bg-finance-red/10 px-3 py-1">
            <Users className="h-3 w-3 mr-1" />
            {customers.length.toLocaleString()} Customers Available
          </Badge>
        </div>
      </div>
      
      {/* Improved Customer Selector Section */}
      <Card className="border-gray-800 bg-gradient-to-r from-black/40 to-gray-900/40 backdrop-blur-sm" style={{ zIndex: 999999, position: 'relative' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Search className="h-4 w-4 text-finance-red" />
            Select Customer
          </CardTitle>
          <CardDescription className="text-gray-400">
            Choose a customer to view their complete visit history and performance analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-2xl relative" style={{ zIndex: 999999, position: 'relative' }}>
            <ImprovedCustomerSelector
              customers={customers}
              selectedCustomer={selectedCustomerName}
              onSelect={handleCustomerSelect}
              placeholder="Search and select a customer to view their visit history..."
              className="h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Statistics Cards - Only show when customer is selected */}
      {selectedCustomerRef && customerStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-gray-800 bg-black/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Visits</p>
                  <p className="text-2xl font-bold text-white">{customerStats.totalVisits}</p>
                </div>
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-800 bg-black/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Orders</p>
                  <p className="text-2xl font-bold text-white">{customerStats.totalOrders}</p>
                </div>
                <FileText className="h-5 w-5 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-800 bg-black/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Profit</p>
                  <p className={`text-2xl font-bold ${customerStats.totalProfit > 0 ? 'text-finance-red' : 'text-gray-400'}`}>
                    {formatCurrency(customerStats.totalProfit)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-finance-red" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-800 bg-black/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Conversion</p>
                  <p className="text-2xl font-bold text-white">{customerStats.conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-800 bg-black/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Avg/Visit</p>
                  <p className={`text-2xl font-bold ${customerStats.avgProfitPerVisit > 0 ? 'text-finance-red' : 'text-gray-400'}`}>
                    {formatCurrency(customerStats.avgProfitPerVisit)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Visit History Table */}
      {selectedCustomerRef && (
        <Card className="border-gray-800 bg-black/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-finance-red" />
                  {selectedCustomerName}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Complete visit history with detailed information
                </CardDescription>
              </div>
              {customerVisits && (
                <Badge variant="outline" className="text-finance-red border-finance-red bg-finance-red/10">
                  {customerVisits.length} Total Visits
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-finance-red border-t-transparent rounded-full"></div>
              </div>
            ) : customerVisits && customerVisits.length > 0 ? (
              <div className="relative">
                {isMobile ? (
                  <ScrollArea className="h-[600px]">
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader className="bg-gray-900/50 sticky top-0 z-10">
                          <TableRow className="hover:bg-gray-900 border-b border-gray-800">
                            <TableHead className="text-white font-semibold text-xs">Date</TableHead>
                            <TableHead className="text-white font-semibold text-xs">Type</TableHead>
                            <TableHead className="text-white font-semibold text-xs">Order</TableHead>
                            <TableHead className="text-white font-semibold text-xs">Profit</TableHead>
                            <TableHead className="text-white font-semibold text-xs">Contact</TableHead>
                            <TableHead className="text-white font-semibold text-xs">Comments</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerVisits.map((visit, index) => (
                            <TableRow 
                              key={visit.id} 
                              className={`border-gray-800 hover:bg-gray-900/30 transition-colors ${
                                index % 2 === 0 ? 'bg-black/10' : 'bg-transparent'
                              }`}
                            >
                              <TableCell className="font-medium text-white text-sm py-4">
                                {formatVisitDate(visit.date)}
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {visit.visit_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {visit.has_order ? (
                                  <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Yes
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs">
                                    No
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className={`font-semibold text-sm ${
                                visit.profit > 0 ? "text-finance-red" : "text-gray-400"
                              }`}>
                                {formatCurrency(visit.profit)}
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm">
                                {visit.contact_name ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-blue-400" />
                                    {visit.contact_name}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm max-w-[250px]">
                                {visit.comments ? (
                                  <div className="truncate" title={visit.comments}>
                                    {visit.comments}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="max-h-[700px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-gray-900/50 sticky top-0 z-10">
                        <TableRow className="hover:bg-gray-900 border-b border-gray-800">
                          <TableHead className="text-white font-semibold">Date</TableHead>
                          <TableHead className="text-white font-semibold">Visit Type</TableHead>
                          <TableHead className="text-white font-semibold">Order</TableHead>
                          <TableHead className="text-white font-semibold">Profit</TableHead>
                          <TableHead className="text-white font-semibold">Contact</TableHead>
                          <TableHead className="text-white font-semibold">Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerVisits.map((visit, index) => (
                          <TableRow 
                            key={visit.id} 
                            className={`border-gray-800 hover:bg-gray-900/30 transition-colors ${
                              index % 2 === 0 ? 'bg-black/10' : 'bg-transparent'
                            }`}
                          >
                            <TableCell className="font-medium text-white py-4">
                              {formatVisitDate(visit.date)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              <Badge variant="outline" className="text-xs">
                                {visit.visit_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {visit.has_order ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Yes
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400 border-gray-700">
                                  No
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className={`font-semibold ${
                              visit.profit > 0 ? "text-finance-red" : "text-gray-400"
                            }`}>
                              {formatCurrency(visit.profit)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {visit.contact_name ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-blue-400" />
                                  {visit.contact_name}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-300 max-w-[300px]">
                              {visit.comments ? (
                                <div className="truncate" title={visit.comments}>
                                  {visit.comments}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-12">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-300 mb-2">No Visit History</h4>
                <p className="text-gray-500">
                  {selectedCustomerRef ? 
                    "No visits found for this customer. This customer hasn't been visited yet." : 
                    "Select a customer above to view their complete visit history."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State when no customer selected */}
      {!selectedCustomerRef && (
        <Card className="border-gray-800 bg-gradient-to-br from-gray-900/20 to-black/40 backdrop-blur-sm">
          <CardContent className="text-center p-16">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-6" />
            <h4 className="text-xl font-semibold text-gray-300 mb-3">Ready to Explore Customer History</h4>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Select a customer from the dropdown above to view their complete visit history, 
              performance metrics, and detailed analytics.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Badge variant="outline" className="text-finance-red border-finance-red bg-finance-red/10">
                {customers.length.toLocaleString()} customers ready to explore
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerHistoryTable;
