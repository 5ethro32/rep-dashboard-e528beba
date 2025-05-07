
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

interface UserSelectorProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string | null, displayName: string) => void;
  className?: string;
}

export default function UserSelector({ selectedUserId, onSelectUser, className }: UserSelectorProps) {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null);

  // Force check admin status directly from the database
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        // Directly query the database for the current user's role
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }
        
        const isUserAdmin = data?.role === 'admin';
        console.log('Direct DB check - User admin status:', isUserAdmin, 'Role:', data?.role);
        setAdminStatus(isUserAdmin);
      } catch (err) {
        console.error('Failed to check admin status:', err);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      
      try {
        const isUserAdmin = adminStatus !== null ? adminStatus : isAdmin;
        console.log('Current user admin status (combined):', isUserAdmin);
        console.log('Admin status from context:', isAdmin);
        console.log('Admin status from direct DB check:', adminStatus);
        
        // For non-admin users, we just include their own profile
        if (!isUserAdmin) {
          console.log('Current user is not an admin. Will only show own data.');
          if (user) {
            const singleUserProfile: UserProfile = {
              id: user.id,
              email: user.email
            };
            setUsers([singleUserProfile]);
          }
          setIsLoading(false);
          return;
        }
        
        // For admin users, fetch all profiles
        console.log('Admin user detected. Fetching all profiles...');
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          toast({
            title: "Error fetching users",
            description: "Could not load user profiles",
            variant: "destructive"
          });
          return;
        }

        // Debug: Log the returned profiles data
        console.log('Profiles fetched:', profilesData?.length || 0, 'profiles');
        if (profilesData?.length === 0) {
          console.warn('No profiles were returned from the database');
        }
        
        // Get the current user's email
        const currentUserEmail = user?.email;
        console.log('Current user email:', currentUserEmail);
        
        // Get the domain from the current user's email if available
        const emailDomain = currentUserEmail ? currentUserEmail.split('@')[1] : 'avergenerics.co.uk';
        
        // Create enhanced profiles by adding email-based usernames
        const enhancedProfiles = profilesData?.map(profile => {
          // For the current user, we can use their email
          const isCurrentUser = profile.id === user?.id;
          const email = isCurrentUser ? currentUserEmail : `${profile.id.split('-')[0]}@${emailDomain}`;
          
          // Debug: Log each profile
          if (isCurrentUser) {
            console.log('Current user profile:', profile);
          }
          
          return {
            ...profile,
            email,
            role: profile.role
          };
        }) || [];
        
        console.log('Enhanced profiles with emails and roles:', enhancedProfiles);
        setUsers(enhancedProfiles);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          title: "Error loading users",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch users if we have determined admin status
    if (adminStatus !== null || isAdmin !== undefined) {
      fetchUsers();
    }
  }, [user, isAdmin, adminStatus]);

  // Format user display name with improved fallback to email username
  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) return 'My Data';
    
    const userProfile = users.find(u => u.id === userId);
    if (!userProfile) return 'Unknown User';
    
    // First try to use first_name and last_name if available
    if (userProfile.first_name || userProfile.last_name) {
      return [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ');
    }
    
    // If we have an email, extract the username part (before @)
    if (userProfile.email) {
      const username = userProfile.email.split('@')[0];
      // Capitalize first letter for better presentation
      return username.charAt(0).toUpperCase() + username.slice(1);
    }
    
    // Last resort: use a portion of the user ID
    return `User ${userId.slice(0, 6)}...`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center gap-2 ${className}`}
        >
          {selectedUserId === user?.id || !selectedUserId ? (
            <User className="h-4 w-4" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          <span className="hidden md:inline">
            {selectedUserId ? getUserDisplayName(selectedUserId) : 'My Data'}
          </span>
          {selectedUserId !== user?.id && selectedUserId && (
            <Badge variant="outline" className="ml-2 text-xs">
              Viewing
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>User Selection</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => onSelectUser(user?.id || null, 'My Data')}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>My Data</span>
            {(selectedUserId === user?.id || !selectedUserId) && (
              <Badge variant="outline" className="ml-auto">Current</Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {users.length === 0 && isLoading ? (
            <DropdownMenuItem disabled>
              Loading users...
            </DropdownMenuItem>
          ) : users.filter(u => u.id !== user?.id).length === 0 ? (
            <DropdownMenuItem disabled>
              {(adminStatus || isAdmin) ? "No other users available" : "Admin access required to view other users"}
            </DropdownMenuItem>
          ) : (
            users
              .filter(u => u.id !== user?.id)
              .map(otherUser => (
                <DropdownMenuItem
                  key={otherUser.id}
                  onClick={() => onSelectUser(
                    otherUser.id, 
                    getUserDisplayName(otherUser.id)
                  )}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{getUserDisplayName(otherUser.id)}</span>
                  {selectedUserId === otherUser.id && (
                    <Badge variant="outline" className="ml-auto">Selected</Badge>
                  )}
                </DropdownMenuItem>
              ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
