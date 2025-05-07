
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        // Also fetch emails from auth.users if we have access (service role)
        // This is just a fallback; typically we won't have direct access
        const authUsers = await supabase.auth.admin.listUsers();
        
        // Map users with emails if available
        let userProfiles = data as UserProfile[];
        
        setUsers(userProfiles);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Format user display name
  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) return 'My Data';
    
    const userProfile = users.find(u => u.id === userId);
    if (!userProfile) return 'Unknown User';
    
    if (userProfile.first_name || userProfile.last_name) {
      return [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ');
    }
    
    return userProfile.email || `User ${userId.slice(0, 6)}...`;
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
