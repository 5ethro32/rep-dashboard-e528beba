
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';

interface UserSelectorProps {
  selectedUserId: string;
  onSelectUser: (userId: string, userName: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ selectedUserId, onSelectUser }) => {
  const { user, isAdmin } = useAuth();

  // Fetch all profiles with emails to display
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      if (!isAdmin) return [];
      
      // Join profiles with auth.users to get emails
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
        
      if (error) throw error;
      
      // Get emails from auth.users table separately, since we can't join directly
      const userEmails = new Map();
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;
      
      users?.users.forEach(user => {
        userEmails.set(user.id, user.email);
      });
      
      // Combine profiles with emails
      return data.map(profile => ({
        id: profile.id,
        name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : userEmails.get(profile.id) || 'Unknown User',
        email: userEmails.get(profile.id) || ''
      }));
    },
    enabled: isAdmin === true
  });

  // If not admin, return null
  if (!isAdmin) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <User size={16} className="text-finance-red" />
        <label className="text-sm font-medium">View Data For:</label>
      </div>
      <Select
        value={selectedUserId}
        onValueChange={(value) => {
          const selectedProfile = profiles?.find(p => p.id === value);
          if (selectedProfile) {
            onSelectUser(selectedProfile.id, selectedProfile.name);
          }
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="mt-1 w-full md:max-w-xs bg-black/30 border-gray-700">
          <SelectValue placeholder={isLoading ? "Loading users..." : "Select user"} />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {user && (
            <SelectItem value={user.id} className="border-b border-gray-700 mb-1 pb-1">
              <span className="font-semibold">My Data (Current User)</span>
            </SelectItem>
          )}
          
          {profiles?.filter(profile => profile.id !== user?.id).map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
              <span className="text-xs text-gray-400 ml-2">
                ({profile.email?.split('@')[0]})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;
