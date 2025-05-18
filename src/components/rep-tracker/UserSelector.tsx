
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
  showAllDataOption?: boolean;
}

export default function UserSelector({ 
  selectedUserId, 
  onSelectUser, 
  className,
  showAllDataOption = false
}: UserSelectorProps) {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const ALL_DATA_ID = "all";

  // Set initial user selection if not set already
  useEffect(() => {
    // If the selectedUserId is "all" but we're on the rep-tracker page,
    // automatically switch to the user's own data
    const currentPath = window.location.pathname;
    if (currentPath === '/rep-tracker' && selectedUserId === ALL_DATA_ID && user) {
      onSelectUser(user.id, 'My Data');
    }
  }, [selectedUserId, user, onSelectUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      console.log('Fetching users with admin status:', isAdmin);
      
      try {
        // For non-admin users, we just include their own profile
        if (!isAdmin) {
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
        console.log('Profile data:', profilesData);
        
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

    // Only fetch users when we have a valid auth state
    if (user && typeof isAdmin !== 'undefined') {
      console.log('Fetching users - User is authenticated and admin status is known');
      fetchUsers();
    } else {
      console.log('Skipping user fetch - User not authenticated or admin status unknown', 
        { authenticated: !!user, adminStatus: isAdmin });
    }
  }, [user, isAdmin]);

  // Format user display name - MODIFIED to use full name (first name + last name)
  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) return 'My Data';
    if (userId === ALL_DATA_ID) return 'All Data';
    
    const userProfile = users.find(u => u.id === userId);
    if (!userProfile) return 'Unknown User';
    
    // Use first_name and last_name together if available
    if (userProfile.first_name && userProfile.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`.trim();
    } else if (userProfile.first_name) {
      return userProfile.first_name;
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

  // Determine what to show in the trigger button
  const getTriggerContent = () => {
    if (selectedUserId === ALL_DATA_ID) {
      return (
        <>
          <Users className="h-4 w-4" />
          <span className="hidden md:inline">All Data</span>
          <Badge variant="outline" className="ml-2 text-xs">
            All Users
          </Badge>
        </>
      );
    } else if (selectedUserId === user?.id) {
      return (
        <>
          <User className="h-4 w-4" />
          <span className="hidden md:inline">My Data</span>
        </>
      );
    } else {
      return (
        <>
          <Users className="h-4 w-4" />
          <span className="hidden md:inline">
            {getUserDisplayName(selectedUserId || '')}
          </span>
          <Badge variant="outline" className="ml-2 text-xs">
            Viewing
          </Badge>
        </>
      );
    }
  };

  // Debug isAdmin access
  console.log('UserSelector render - isAdmin:', isAdmin, 'Available users:', users.length);

  // Only offer other users if the user is an admin
  const canSwitchUsers = isAdmin === true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center gap-2 ${className}`}
          onClick={() => console.log('Dropdown trigger clicked')}
        >
          {getTriggerContent()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>User Selection</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Show All Data option if enabled and user is admin */}
          {showAllDataOption && canSwitchUsers && (
            <>
              <DropdownMenuItem 
                onClick={() => {
                  console.log('Selected "All Data"');
                  onSelectUser(ALL_DATA_ID, 'All Data');
                }}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>All Data</span>
                {selectedUserId === ALL_DATA_ID && (
                  <Badge variant="outline" className="ml-auto">Current</Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Always show "My Data" option */}
          <DropdownMenuItem 
            onClick={() => {
              console.log('Selected "My Data"');
              onSelectUser(user?.id || null, 'My Data');
            }}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>My Data</span>
            {(selectedUserId === user?.id && selectedUserId !== ALL_DATA_ID) && (
              <Badge variant="outline" className="ml-auto">Current</Badge>
            )}
          </DropdownMenuItem>
          
          {canSwitchUsers && users.length > 0 && (
            <DropdownMenuSeparator />
          )}
          
          {users.length === 0 && isLoading ? (
            <DropdownMenuItem disabled>
              Loading users...
            </DropdownMenuItem>
          ) : !canSwitchUsers ? (
            // Don't show other users if not admin
            null
          ) : users.filter(u => u.id !== user?.id).length === 0 ? (
            <DropdownMenuItem disabled>
              No other users available
            </DropdownMenuItem>
          ) : (
            // Only show other users if admin
            users
              .filter(u => u.id !== user?.id)
              .map(otherUser => (
                <DropdownMenuItem
                  key={otherUser.id}
                  onClick={() => {
                    console.log('Selected other user:', otherUser.id);
                    onSelectUser(
                      otherUser.id, 
                      getUserDisplayName(otherUser.id)
                    );
                  }}
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
