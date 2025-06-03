import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, Trophy, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTargets } from '@/hooks/useTargets';
import { TargetFilters as TargetFiltersType, CreateTargetRequest, UpdateTargetRequest, TargetWithParticipants } from '@/types/targets.types';
import TargetCreationForm from '@/components/targets/TargetCreationForm';
import TargetEditForm from '@/components/targets/TargetEditForm';
import TargetCard from '@/components/targets/TargetCard';
import ProgressUpdateModal from '@/components/targets/ProgressUpdateModal';
import UserRoleSwitcher from '@/components/dev/UserRoleSwitcher';
import { TargetsService } from '@/services/targetsService';

// Stable initial filters object to prevent infinite re-renders
const INITIAL_FILTERS: TargetFiltersType = {};

const Targets = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State management
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTargetForEdit, setSelectedTargetForEdit] = useState<TargetWithParticipants | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTargetForProgress, setSelectedTargetForProgress] = useState<TargetWithParticipants | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [filters, setFilters] = useState<TargetFiltersType>(INITIAL_FILTERS);
  
  // Custom hook for target operations
  const {
    targets,
    isLoading,
    error,
    createTarget,
    updateTarget,
    deleteTarget,
    updateProgress,
    refreshTargets,
    activeTargets,
    completedTargets,
    totalParticipants
  } = useTargets(filters);

  // Filter targets based on active tab
  const getFilteredTargets = () => {
    switch (activeTab) {
      case 'active':
        return targets.filter(target => target.status === 'active');
      case 'completed':
        return targets.filter(target => target.status === 'completed' || target.status === 'expired');
      case 'all':
      default:
        return targets;
    }
  };

  const filteredTargets = getFilteredTargets();

  // Calculate summary statistics
  const summaryStats = {
    totalActive: activeTargets.length,
    totalCompleted: completedTargets.length,
    totalParticipants: totalParticipants,
    completionRate: targets.length > 0 
      ? Math.round((completedTargets.length / targets.length) * 100)
      : 0
  };

  // Handle target creation
  const handleCreateTarget = async (targetData: CreateTargetRequest) => {
    try {
      await createTarget(targetData);
      setShowCreateForm(false);
      toast({
        title: "Target Created",
        description: "New target has been successfully created and is now active.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create target. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle target update
  const handleUpdateTarget = async (targetData: UpdateTargetRequest) => {
    try {
      await updateTarget(targetData);
      setShowEditForm(false);
      setSelectedTargetForEdit(null);
      toast({
        title: "Target Updated",
        description: "Target has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update target. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle target editing
  const handleEditTarget = async (target: TargetWithParticipants) => {
    setSelectedTargetForEdit(target);
    setShowEditForm(true);
  };

  // Handle target deletion
  const handleDeleteTarget = async (targetId: string) => {
    try {
      await deleteTarget(targetId);
      toast({
        title: "Target Deleted",
        description: "Target has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete target. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle target viewing
  const handleViewTarget = (target: TargetWithParticipants) => {
    // TODO: Implement detailed view in next phase
    toast({
      title: "Target Details",
      description: "Detailed target view will be available in the next update.",
    });
  };

  // Handle progress update
  const handleUpdateProgress = (target: TargetWithParticipants) => {
    setSelectedTargetForProgress(target);
    setShowProgressModal(true);
  };

  // Handle progress submission
  const handleProgressSubmit = async (targetId: string, userId: string, progress: number, notes?: string) => {
    try {
      await updateProgress(targetId, userId, progress);
      setShowProgressModal(false);
      setSelectedTargetForProgress(null);
      toast({
        title: "Progress Updated",
        description: "Your progress has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle direct progress update (for quick actions)
  const handleDirectProgressUpdate = async (targetId: string, userId: string, progress: number) => {
    try {
      await updateProgress(targetId, userId, progress);
      // No toast for quick updates to avoid spam - the UI will show visual feedback
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw so the component can handle the error state
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: TargetFiltersType) => {
    setFilters(newFilters);
  };

  // Store refresh function in ref to avoid dependency issues
  const refreshRef = useRef(refreshTargets);
  refreshRef.current = refreshTargets;

  // Auto-refresh targets every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRef.current();
    }, 30000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array is safe now

  // Show error state
  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent">
        <Card className="bg-red-900/20 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading targets: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-400" />
              Targets & Goals
            </h1>
            <p className="text-gray-400 mt-2">
              {isAdmin 
                ? "Create and manage competitive targets to drive team performance" 
                : "Track your progress and compete with your team"
              }
            </p>
          </div>
          
          {isAdmin && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Target
            </Button>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-400">Active</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{summaryStats.totalActive}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Completed</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{summaryStats.totalCompleted}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-400">Participants</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{summaryStats.totalParticipants}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-400">Success Rate</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{summaryStats.completionRate}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-6">
        <TabsList className="bg-gray-900/40 border-white/10">
          <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">
            Active Targets ({summaryStats.totalActive})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600">
            Completed ({summaryStats.totalCompleted})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
            All Targets ({targets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gray-900/40 backdrop-blur-sm border-white/10">
                  <CardContent className="pt-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-2 bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-8 bg-gray-700 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTargets.length === 0 ? (
            <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Active Targets</h3>
                <p className="text-gray-400 mb-4">
                  {isAdmin 
                    ? "Create your first target to start engaging your team with competitive goals."
                    : "No active targets at the moment. Check back later for new challenges!"
                  }
                </p>
                {isAdmin && (
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Target
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTargets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  onEdit={handleEditTarget}
                  onDelete={handleDeleteTarget}
                  onView={handleViewTarget}
                  onUpdateProgress={handleUpdateProgress}
                  onProgressUpdate={handleDirectProgressUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {/* Similar structure for completed targets */}
          {filteredTargets.length === 0 ? (
            <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Completed Targets</h3>
                <p className="text-gray-400">Completed targets will appear here once goals are achieved.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTargets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  onEdit={handleEditTarget}
                  onDelete={handleDeleteTarget}
                  onView={handleViewTarget}
                  onUpdateProgress={handleUpdateProgress}
                  onProgressUpdate={handleDirectProgressUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {/* Combined view of all targets */}
          {filteredTargets.length === 0 ? (
            <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Targets Yet</h3>
                <p className="text-gray-400 mb-4">
                  {isAdmin 
                    ? "Start creating targets to engage your team with competitive goals."
                    : "No targets have been created yet. Check back later!"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTargets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  onEdit={handleEditTarget}
                  onDelete={handleDeleteTarget}
                  onView={handleViewTarget}
                  onUpdateProgress={handleUpdateProgress}
                  onProgressUpdate={handleDirectProgressUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Target Form Modal */}
      {showCreateForm && (
        <TargetCreationForm
          onSubmit={handleCreateTarget}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isLoading}
        />
      )}

      {/* Edit Target Form Modal */}
      {showEditForm && selectedTargetForEdit && (
        <TargetEditForm
          target={selectedTargetForEdit}
          onSubmit={handleUpdateTarget}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedTargetForEdit(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Progress Update Modal */}
      {showProgressModal && selectedTargetForProgress && (
        <ProgressUpdateModal
          target={selectedTargetForProgress}
          onSubmit={handleProgressSubmit}
          onClose={() => {
            setShowProgressModal(false);
            setSelectedTargetForProgress(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Development User Role Switcher */}
      <UserRoleSwitcher />
    </div>
  );
};

export default Targets; 