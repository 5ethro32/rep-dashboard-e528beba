
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { User } from 'lucide-react';

interface UserSelectorProps {
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
}

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({ selectedUserId, onSelectUser }) => {
  const { user: currentUser } = useAuth();
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // We need admin access to get all users so we'll just get public profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (error) throw error;
      
      return data as UserProfile[];
    }
  });

  const handleChange = (userId: string) => {
    onSelectUser(userId);
  };

  // Format user display name
  const formatUserName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else {
      return user.id.substring(0, 8); // Use part of the UUID if no name available
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <User className="h-5 w-5 text-finance-red" />
      <Select value={selectedUserId} onValueChange={handleChange} disabled={isLoading}>
        <SelectTrigger className="w-[180px] bg-background border-gray-800">
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
        <SelectContent>
          {currentUser && (
            <SelectItem value={currentUser.id} className="cursor-pointer">
              My Data (Current User)
            </SelectItem>
          )}
          {users?.filter(u => u.id !== currentUser?.id).map((user) => (
            <SelectItem key={user.id} value={user.id} className="cursor-pointer">
              {formatUserName(user)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;
