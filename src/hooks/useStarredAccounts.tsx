
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

interface StarredAccount {
  id: string;
  account_ref: string;
  account_name: string;
}

export function useStarredAccounts() {
  const { user, isAdmin } = useAuth();
  const [adminStarredAccounts, setAdminStarredAccounts] = useState<StarredAccount[]>([]);
  const [userStarredAccounts, setUserStarredAccounts] = useState<StarredAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch both admin-starred and user-starred accounts
  const fetchStarredAccounts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch admin-starred accounts (visible to all users)
      const { data: adminData, error: adminError } = await supabase
        .from('admin_starred_accounts')
        .select('id, account_ref, account_name');
      
      if (adminError) throw adminError;
      setAdminStarredAccounts(adminData || []);
      
      // Fetch user's personal starred accounts
      const { data: userData, error: userError } = await supabase
        .from('user_starred_accounts')
        .select('id, account_ref, account_name')
        .eq('user_id', user.id);
      
      if (userError) throw userError;
      setUserStarredAccounts(userData || []);
      
    } catch (error) {
      console.error('Error fetching starred accounts:', error);
      toast.error('Failed to load starred accounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle admin star (only available to admin users)
  const toggleAdminStar = async (accountRef: string, accountName: string, isStarred: boolean) => {
    if (!user || !isAdmin) {
      toast.error('You do not have permission to mark global key accounts');
      return;
    }
    
    try {
      if (isStarred) {
        // Remove admin star
        const { error } = await supabase
          .from('admin_starred_accounts')
          .delete()
          .eq('account_ref', accountRef);
        
        if (error) throw error;
        setAdminStarredAccounts(prev => prev.filter(account => account.account_ref !== accountRef));
        toast.success('Removed from key accounts');
      } else {
        // Add admin star
        const { error } = await supabase
          .from('admin_starred_accounts')
          .insert({
            account_ref: accountRef,
            account_name: accountName,
            starred_by: user.id
          });
        
        if (error) throw error;
        fetchStarredAccounts(); // Refresh to get the new ID
        toast.success('Added to key accounts');
      }
    } catch (error) {
      console.error('Error toggling admin star:', error);
      toast.error('Failed to update key account status');
    }
  };

  // Toggle user's personal star
  const toggleUserStar = async (accountRef: string, accountName: string, isStarred: boolean) => {
    if (!user) {
      toast.error('You must be logged in to bookmark accounts');
      return;
    }
    
    try {
      if (isStarred) {
        // Remove user star
        const { error } = await supabase
          .from('user_starred_accounts')
          .delete()
          .eq('account_ref', accountRef)
          .eq('user_id', user.id);
        
        if (error) throw error;
        setUserStarredAccounts(prev => prev.filter(account => account.account_ref !== accountRef));
        toast.success('Removed from your bookmarks');
      } else {
        // Add user star
        const { error } = await supabase
          .from('user_starred_accounts')
          .insert({
            account_ref: accountRef,
            account_name: accountName,
            user_id: user.id
          });
        
        if (error) throw error;
        fetchStarredAccounts(); // Refresh to get the new ID
        toast.success('Added to your bookmarks');
      }
    } catch (error) {
      console.error('Error toggling user star:', error);
      toast.error('Failed to update bookmark');
    }
  };

  // Check if an account is admin-starred
  const isAdminStarred = (accountRef: string) => {
    return adminStarredAccounts.some(account => account.account_ref === accountRef);
  };

  // Check if an account is user-starred
  const isUserStarred = (accountRef: string) => {
    return userStarredAccounts.some(account => account.account_ref === accountRef);
  };

  // Load starred accounts on component mount or when user changes
  useEffect(() => {
    if (user) {
      fetchStarredAccounts();
    }
  }, [user]);

  return {
    adminStarredAccounts,
    userStarredAccounts,
    isLoading,
    toggleAdminStar,
    toggleUserStar,
    isAdminStarred,
    isUserStarred,
    fetchStarredAccounts,
    isAdmin
  };
}
