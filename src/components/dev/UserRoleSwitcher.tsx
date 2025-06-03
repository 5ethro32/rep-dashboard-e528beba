import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Shield, 
  Users, 
  Settings, 
  Eye,
  RefreshCw,
  Crown,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  avatar?: string;
}

// Mock users for testing different perspectives
const MOCK_USERS: MockUser[] = [
  {
    id: 'admin-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'admin',
    department: 'Management'
  },
  {
    id: 'user-1',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    role: 'user',
    department: 'Sales'
  },
  {
    id: 'user-2',
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    role: 'user',
    department: 'Sales'
  },
  {
    id: 'user-3',
    name: 'James Rodriguez',
    email: 'james.rodriguez@company.com',
    role: 'user',
    department: 'Marketing'
  },
  {
    id: 'user-4',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@company.com',
    role: 'user',
    department: 'Sales'
  }
];

interface UserRoleSwitcherProps {
  onUserChange?: (user: MockUser) => void;
  className?: string;
}

const UserRoleSwitcher: React.FC<UserRoleSwitcherProps> = ({
  onUserChange,
  className
}) => {
  const { user: currentUser, isAdmin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('admin-1');
  const [isDevMode, setIsDevMode] = useState(false);

  const selectedUser = MOCK_USERS.find(u => u.id === selectedUserId) || MOCK_USERS[0];

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user && onUserChange) {
      onUserChange(user);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  if (!isDevMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsDevMode(true)}
          variant="outline"
          size="sm"
          className="bg-gray-900/90 border-gray-600 text-white hover:bg-gray-800"
        >
          <Eye className="h-4 w-4 mr-2" />
          Dev Mode
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-gray-900/95 backdrop-blur-sm border-yellow-500/50 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-yellow-400" />
              <CardTitle className="text-sm text-white">Development Mode</CardTitle>
            </div>
            <Button
              onClick={() => setIsDevMode(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              ×
            </Button>
          </div>
          <CardDescription className="text-xs text-yellow-200">
            Switch user perspectives to test targets functionality
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Real User */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wide">
              Current Real User
            </Label>
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded border border-gray-600">
              <User className="h-4 w-4 text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {currentUser?.email || 'Not logged in'}
                </p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isAdmin ? 'default' : 'secondary'}
                    className={`text-xs ${isAdmin ? 'bg-green-600' : 'bg-gray-600'}`}
                  >
                    {isAdmin ? 'Admin' : 'User'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-600" />

          {/* Mock User Selector */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wide">
              Test As User
            </Label>
            <Select value={selectedUserId} onValueChange={handleUserChange}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {MOCK_USERS.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <Crown className="h-3 w-3 text-yellow-400" />
                      ) : (
                        <UserCheck className="h-3 w-3 text-blue-400" />
                      )}
                      <span>{user.name}</span>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={`text-xs ml-auto ${user.role === 'admin' ? 'bg-yellow-600' : 'bg-blue-600'}`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected User Details */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wide">
              Testing Perspective
            </Label>
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
              <div className="flex items-center gap-2 mb-2">
                {selectedUser.role === 'admin' ? (
                  <Shield className="h-4 w-4 text-yellow-400" />
                ) : (
                  <User className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-white font-medium">{selectedUser.name}</span>
                <Badge 
                  variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}
                  className={`text-xs ${selectedUser.role === 'admin' ? 'bg-yellow-600' : 'bg-blue-600'}`}
                >
                  {selectedUser.role}
                </Badge>
              </div>
              <p className="text-xs text-gray-300">{selectedUser.email}</p>
              <p className="text-xs text-gray-400">{selectedUser.department}</p>
            </div>
          </div>

          {/* Test Scenarios */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wide">
              What You Can Test
            </Label>
            <div className="text-xs text-gray-300 space-y-1">
              {selectedUser.role === 'admin' ? (
                <>
                  <p>• Create and manage targets</p>
                  <p>• View all participants' progress</p>
                  <p>• Edit and delete targets</p>
                  <p>• Access admin controls</p>
                </>
              ) : (
                <>
                  <p>• View assigned targets</p>
                  <p>• Update personal progress</p>
                  <p>• See leaderboards</p>
                  <p>• Track team goals</p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleRefreshPage}
              variant="outline"
              size="sm"
              className="flex-1 border-gray-600 text-white hover:bg-gray-700"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Warning */}
          <div className="text-xs text-yellow-200 bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
            <strong>Note:</strong> This is for development testing only. The UI will show the perspective of the selected user, but actual data operations use your real authentication.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleSwitcher; 