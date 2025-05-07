
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

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface UserSelectorProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string | null, displayName: string) => void;
  className?: string;
}

export default function UserSelector({ selectedUserId, onSelectUser, className }: UserSelectorProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Fetch both profiles and users to get emails
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Debug: Log the returned profiles data
        console.log('Profiles fetched:', profilesData);
        
        // Try to get the current user's email for reference
        const currentUserEmail = user?.email;
        console.log('Current user email:', currentUserEmail);
        
        // Get the domain from the current user's email if available
        const emailDomain = currentUserEmail ? currentUserEmail.split('@')[1] : 'avergenerics.co.uk';
        
        // Create enhanced profiles by adding email-based usernames
        const enhancedProfiles = profilesData?.map(profile => {
          // For the current user, we can use their email
          const isCurrentUser = profile.id === user?.id;
          const email = isCurrentUser ? currentUserEmail : `${profile.id}@${emailDomain}`;
          
          return {
            ...profile,
            email
          };
        }) || [];
        
        console.log('Enhanced profiles with emails:', enhancedProfiles);
        setUsers(enhancedProfiles);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

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
              No other users available
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
