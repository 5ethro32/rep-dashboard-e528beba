import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit2, Trash2, Calendar, CheckCircle2, Eye, EyeOff, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AddPlanDialog from './AddPlanDialog';
import EditPlanDialog from './EditPlanDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePlanMutation } from '@/hooks/usePlanMutation';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/utils/rep-performance-utils';

interface WeekPlan {
  id: string;
  planned_date: string;
  customer_name: string;
  customer_ref: string;
  notes: string | null;
  user_id: string; // Include user_id in the interface
}

interface CustomerVisit {
  id: string;
  week_plan_id: string;
  has_order: boolean;
  profit?: number;
  comments?: string;
  contact_name?: string;
  visit_type?: string;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface WeekPlanTabV2Props {
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Array<{ account_name: string; account_ref: string }>;
  onAddPlanSuccess?: () => void;
  selectedUserId?: string | null;  // New prop for selected user
  isViewingOwnData?: boolean;      // New prop to indicate if viewing own data
}

const WeekPlanTabV2: React.FC<WeekPlanTabV2Props> = ({ 
  weekStartDate, 
  weekEndDate, 
  customers,
  onAddPlanSuccess,
  selectedUserId,
  isViewingOwnData = true  // Default to viewing own data
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlan, setSelectedPlan] = useState<WeekPlan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const userId = selectedUserId || user?.id;
  const isAllDataView = selectedUserId === "all"; // Check if this is the "All Data" view
  const weekPlansQueryKey = ['week-plans', weekStartDate.toISOString(), weekEndDate.toISOString(), userId];

  // Query to fetch user profiles for the "All Data" view
  const { data: userProfiles } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      if (!isAllDataView) return []; // Only fetch profiles for "All Data" view
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
        
      if (error) {
        console.error('Error fetching user profiles:', error);
        throw error;
      }
      return data as UserProfile[];
    },
    enabled: isAllDataView,
  });

  const { data: weekPlans, isLoading } = useQuery({
    queryKey: weekPlansQueryKey,
    queryFn: async () => {
      const query = supabase
        .from('week_plans')
        .select('*')
        .gte('planned_date', weekStartDate.toISOString().split('T')[0])
        .lte('planned_date', weekEndDate.toISOString().split('T')[0]);
        
      // Only filter by user_id if we have a selected user and it's not "all"
      if (userId && userId !== "all") {
        query.eq('user_id', userId);
      }
      
      query.order('planned_date');
      
      const { data, error } = await query;

      if (error) throw error;
      return data as WeekPlan[];
    },
    meta: {
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: 'Failed to load week plans',
          variant: 'destructive',
        });
      },
    },
    staleTime: 0
  });

  // Query to fetch customer visits that are associated with week plans
  const { data: customerVisits } = useQuery({
    queryKey: ['customer-visits-for-week-plans', weekStartDate.toISOString(), weekEndDate.toISOString(), userId],
    queryFn: async () => {
      if (!weekPlans || weekPlans.length === 0) return [];
      
      const planIds = weekPlans.map(plan => plan.id);
      
      const { data, error } = await supabase
        .from('customer_visits')
        .select('id, week_plan_id, has_order, profit, comments, contact_name, visit_type')
        .in('week_plan_id', planIds);
      
      if (error) throw error;
      return data as CustomerVisit[];
    },
    enabled: !!weekPlans && weekPlans.length > 0,
    staleTime: 0
  });

  // Helper function to determine if a user can edit a particular plan
  const canEditPlan = (plan: WeekPlan) => {
    if (!isViewingOwnData) return false;
    if (isAllDataView) return user?.id === plan.user_id;
    return true;
  };

  // Helper function to get a user's display name from their ID
  const getUserDisplayName = (userId: string): string => {
    if (userId === user?.id) return "My Plans";
    
    if (userProfiles) {
      const profile = userProfiles.find(p => p.id === userId);
      if (profile) {
        if (profile.first_name && profile.last_name) {
          return `${profile.first_name} ${profile.last_name}'s Plans`;
        } else if (profile.first_name) {
          return `${profile.first_name}'s Plans`;
        }
      }
    }
    
    // Fallback - use a shorter version of the UUID if no name is available
    return `${userId.split('-')[0]}'s Plans`;
  };

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      // First check if there are any associated customer visits
      const { data: relatedVisits } = await supabase
        .from('customer_visits')
        .select('id')
        .eq('week_plan_id', planId);
      
      // Delete any associated customer visits first
      if (relatedVisits && relatedVisits.length > 0) {
        const visitIds = relatedVisits.map(visit => visit.id);
        const { error: visitDeleteError } = await supabase
          .from('customer_visits')
          .delete()
          .in('id', visitIds);
        
        if (visitDeleteError) {
          console.error("Error deleting associated customer visits:", visitDeleteError);
          // Continue with deleting the plan even if visit deletion fails
        }
      }
      
      // Then delete the plan itself
      const { error } = await supabase
        .from('week_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      return planId;
    },
    onSuccess: (deletedPlanId) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        weekPlansQueryKey,
        (old: WeekPlan[] | undefined) => old?.filter(plan => plan.id !== deletedPlanId) || []
      );

      // Then invalidate to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['week-plans'],
        exact: false,
        refetchType: 'all'
      });
      
      // Also invalidate customer visits
      queryClient.invalidateQueries({ 
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });

      toast({
        title: 'Plan Deleted',
        description: 'Week plan and associated customer visit have been deleted successfully.',
      });

      setDeleteConfirmOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      deletePlanMutation.mutate(planToDelete);
    }
  };

  const handleAddPlan = (date?: Date) => {
    setSelectedDate(date);
    setIsAddPlanOpen(true);
  };

  const handleEditPlan = (plan: WeekPlan) => {
    setSelectedPlan(plan);
    setIsEditPlanOpen(true);
  };

  const handleAddPlanSuccess = () => {
    setIsAddPlanOpen(false);
    // Call the parent's success handler if provided
    if (onAddPlanSuccess) {
      onAddPlanSuccess();
    }
    
    // Explicitly refresh the data
    queryClient.invalidateQueries({ 
      queryKey: weekPlansQueryKey,
      refetchType: 'all'
    });
    
    // Also refresh customer visits data
    queryClient.invalidateQueries({ 
      queryKey: ['customer-visits'],
      exact: false,
      refetchType: 'all'
    });
  };

  const handleEditPlanSuccess = () => {
    setIsEditPlanOpen(false);
    
    // Explicitly refresh the data
    queryClient.invalidateQueries({ 
      queryKey: weekPlansQueryKey, 
      refetchType: 'all'
    });
    
    // Also refresh customer visits data
    queryClient.invalidateQueries({ 
      queryKey: ['customer-visits'],
      exact: false,
      refetchType: 'all'
    });
  };

  // Helper function to check if a plan has an associated customer visit
  const hasAssociatedVisit = (planId: string) => {
    return customerVisits?.some(visit => visit.week_plan_id === planId);
  };

  // Helper function to check if an associated visit has an order
  const visitHasOrder = (planId: string) => {
    return customerVisits?.some(visit => visit.week_plan_id === planId && visit.has_order);
  };

  // Helper function to get visit details for a plan
  const getVisitDetails = (planId: string) => {
    return customerVisits?.find(visit => visit.week_plan_id === planId);
  };

  // Helper function to get formatted profit value
  const getVisitProfit = (planId: string): string => {
    const visit = getVisitDetails(planId);
    if (visit && visit.has_order) {
      return formatCurrency(visit.profit || 0);
    }
    return '';
  };

  // Helper function to truncate combined text for brief view
  const getTruncatedText = (text: string, maxLines: number = 1.5): string => {
    if (!text) return '';
    
    // More aggressive truncation - limit to approximate character count for 3 lines
    const maxCharsPerLine = isMobile ? 35 : 50; // Adjust based on mobile/desktop
    const maxChars = maxLines * maxCharsPerLine;
    
    if (text.length <= maxChars) return text;
    
    // Find the last space before the character limit to avoid cutting words
    const truncated = text.substring(0, maxChars);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    return (lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated) + '...';
  };

  // Helper function to combine plan notes and visit comments
  const getCombinedComments = (planId: string): { combined: string; planNotes: string; visitComments: string } => {
    const plan = weekPlans?.find(p => p.id === planId);
    const visitDetails = getVisitDetails(planId);
    
    const planNotes = plan?.notes || '';
    const visitComments = visitDetails?.comments || '';
    
    let combined = '';
    if (planNotes && visitComments) {
      combined = `Plan: ${planNotes} Visit: ${visitComments}`;
    } else if (planNotes) {
      combined = `Plan: ${planNotes}`;
    } else if (visitComments) {
      combined = `Visit: ${visitComments}`;
    }
    
    return { combined, planNotes, visitComments };
  };

  // Helper function to toggle card expansion
  const toggleCardExpansion = (planId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Group plans by user for the All Data view
  const plansByUser = React.useMemo(() => {
    if (!isAllDataView || !weekPlans) return {};
    
    return weekPlans.reduce((acc: Record<string, WeekPlan[]>, plan) => {
      if (!acc[plan.user_id]) {
        acc[plan.user_id] = [];
      }
      acc[plan.user_id].push(plan);
      return acc;
    }, {});
  }, [isAllDataView, weekPlans]);

  if (isLoading) {
    return <div className="text-center py-8 text-white/60">Loading week plans...</div>;
  }

  if (isAllDataView) {
    // All data view (Aver's Planner)
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Week Plan - All Reps</h3>
        </div>

        {Object.keys(plansByUser).length === 0 ? (
          <div className="text-center py-8 text-white/60">No plans found for this week.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(plansByUser).map(([userId, userPlans]) => {
              return (
                <div key={userId} className="space-y-4">
                  <h4 className="font-medium text-base border-b border-gray-800 pb-2">
                    {getUserDisplayName(userId)}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {days.map((day, index) => {
                      const currentDate = new Date(weekStartDate);
                      currentDate.setDate(weekStartDate.getDate() + index);
                      const dayPlans = userPlans.filter(
                        plan => new Date(plan.planned_date).toDateString() === currentDate.toDateString()
                      );

                      return (
                        <Card key={`${userId}-${day}`} className="border-gray-800 bg-black/20">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-white">
                                {day} - {format(currentDate, 'dd/MM')}
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {dayPlans.map(plan => (
                                <div 
                                  key={plan.id} 
                                  className="p-2 rounded bg-black/30 border border-gray-800"
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                      <p className="text-sm font-medium">{plan.customer_name}</p>
                                      {plan.customer_ref === 'PROSPECT' && (
                                        <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                                          Prospect
                                        </Badge>
                                      )}
                                    </div>
                                    {hasAssociatedVisit(plan.id) && (
                                      <div className="ml-2">
                                        {visitHasOrder(plan.id) ? (
                                          <Badge className="bg-green-600 text-xs">Order</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs border-gray-500">Visit</Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Show profit if order was taken */}
                                  {hasAssociatedVisit(plan.id) && visitHasOrder(plan.id) && (
                                    <p className="text-sm text-green-400 mt-1 font-medium">
                                      {getVisitProfit(plan.id)} profit
                                    </p>
                                  )}
                                  
                                  {/* Show combined comments (plan + visit) */}
                                  {(() => {
                                    const { combined, planNotes, visitComments } = getCombinedComments(plan.id);
                                    const isExpanded = expandedCards.has(plan.id);
                                    const visitDetails = getVisitDetails(plan.id);
                                    
                                    if (!combined) return null;
                                    
                                    return (
                                      <div className="mt-1">
                                        {isExpanded ? (
                                          // Expanded view - show full details separately
                                          <div className="space-y-1">
                                            {planNotes && (
                                              <p className="text-sm text-gray-400">
                                                <span className="text-xs text-blue-400">Plan:</span> {planNotes}
                                              </p>
                                            )}
                                            {visitComments && (
                                              <p className="text-sm text-gray-300">
                                                <span className="text-xs text-orange-400">Visit:</span> {visitComments}
                                              </p>
                                            )}
                                            {/* Show additional details when expanded */}
                                            {visitDetails && (
                                              <div className="mt-2 space-y-1">
                                                {visitDetails.contact_name && (
                                                  <p className="text-xs text-gray-400">
                                                    <span className="text-xs text-purple-400">Contact:</span> {visitDetails.contact_name}
                                                  </p>
                                                )}
                                                {visitDetails.visit_type && (
                                                  <p className="text-xs text-gray-400">
                                                    <span className="text-xs text-cyan-400">Type:</span> {visitDetails.visit_type}
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          // Collapsed view - show truncated combined text
                                          <p className="text-sm text-gray-300">
                                            {getTruncatedText(combined)}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 flex items-center justify-center text-gray-500 hover:text-white"
                                      onClick={() => toggleCardExpansion(plan.id)}
                                    >
                                      {expandedCards.has(plan.id) ? (
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                                      )}
                                      <span className="sr-only">
                                        {expandedCards.has(plan.id) ? 'Collapse Details' : 'Expand Details'}
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {dayPlans.length === 0 && (
                                <p className="text-sm text-gray-500">No visits planned</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Regular view (Single user)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Week Plan</h3>
        {isViewingOwnData && (
          <Button 
            onClick={() => handleAddPlan()}
            className="bg-finance-red hover:bg-finance-red/80"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day, index) => {
          const currentDate = new Date(weekStartDate);
          currentDate.setDate(weekStartDate.getDate() + index);
          const dayPlans = weekPlans?.filter(
            plan => new Date(plan.planned_date).toDateString() === currentDate.toDateString()
          ) || [];

          return (
            <Card key={day} className="border-gray-800 bg-black/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-white">
                    {day} - {format(currentDate, 'dd/MM')}
                  </h4>
                  {isViewingOwnData && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleAddPlan(currentDate)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {dayPlans.map(plan => (
                    <div 
                      key={plan.id} 
                      className="p-2 rounded bg-black/30 border border-gray-800"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium">{plan.customer_name}</p>
                          {plan.customer_ref === 'PROSPECT' && (
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                              Prospect
                            </Badge>
                          )}
                        </div>
                        {hasAssociatedVisit(plan.id) && (
                          <div className="ml-2">
                            {visitHasOrder(plan.id) ? (
                              <Badge className="bg-green-600 text-xs">Order</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-gray-500">Visit</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Show profit if order was taken */}
                      {hasAssociatedVisit(plan.id) && visitHasOrder(plan.id) && (
                        <p className="text-sm text-green-400 mt-1 font-medium">
                          {getVisitProfit(plan.id)} profit
                        </p>
                      )}
                      
                      {/* Show combined comments (plan + visit) */}
                      {(() => {
                        const { combined, planNotes, visitComments } = getCombinedComments(plan.id);
                        const isExpanded = expandedCards.has(plan.id);
                        const visitDetails = getVisitDetails(plan.id);
                        
                        if (!combined) return null;
                        
                        return (
                          <div className="mt-1">
                            {isExpanded ? (
                              // Expanded view - show full details separately
                              <div className="space-y-1">
                                {planNotes && (
                                  <p className="text-sm text-gray-400">
                                    <span className="text-xs text-blue-400">Plan:</span> {planNotes}
                                  </p>
                                )}
                                {visitComments && (
                                  <p className="text-sm text-gray-300">
                                    <span className="text-xs text-orange-400">Visit:</span> {visitComments}
                                  </p>
                                )}
                                {/* Show additional details when expanded */}
                                {visitDetails && (
                                  <div className="mt-2 space-y-1">
                                    {visitDetails.contact_name && (
                                      <p className="text-xs text-gray-400">
                                        <span className="text-xs text-purple-400">Contact:</span> {visitDetails.contact_name}
                                      </p>
                                    )}
                                    {visitDetails.visit_type && (
                                      <p className="text-xs text-gray-400">
                                        <span className="text-xs text-cyan-400">Type:</span> {visitDetails.visit_type}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Collapsed view - show truncated combined text
                              <p className="text-sm text-gray-300">
                                {getTruncatedText(combined)}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                      
                      {canEditPlan(plan) ? (
                        <div className="flex justify-end space-x-2 mt-2">
                          {/* Add expand button for own plans too if there are any comments */}
                          {getCombinedComments(plan.id).combined && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleCardExpansion(plan.id)}
                            >
                              {expandedCards.has(plan.id) ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 flex items-center justify-center text-gray-500 hover:text-white"
                            onClick={() => toggleCardExpansion(plan.id)}
                          >
                            {expandedCards.has(plan.id) ? (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {expandedCards.has(plan.id) ? 'Collapse Details' : 'Expand Details'}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {dayPlans.length === 0 && (
                    <p className="text-sm text-gray-500">No visits planned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Only show dialogs when viewing own data */}
      {isViewingOwnData && (
        <>
          <AddPlanDialog 
            isOpen={isAddPlanOpen}
            onClose={() => setIsAddPlanOpen(false)}
            customers={customers}
            selectedDate={selectedDate}
            onSuccess={handleAddPlanSuccess}
          />

          <EditPlanDialog
            isOpen={isEditPlanOpen}
            onClose={() => setIsEditPlanOpen(false)}
            plan={selectedPlan}
            customers={customers}
            onSuccess={handleEditPlanSuccess}
          />

          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this plan? This will also delete any associated customer visit record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default WeekPlanTabV2;
