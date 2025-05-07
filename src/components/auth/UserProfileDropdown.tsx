
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GradientAvatar, GradientAvatarFallback } from '@/components/ui/gradient-avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, User, Moon, Sun } from 'lucide-react';

const UserProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
      setOpen(false);
    }
  };
  
  const handleDisabledAction = () => {
    toast({
      title: "Not implemented yet",
      description: "This feature is not available yet."
    });
    setOpen(false);
  };
  
  if (!user) return null;
  
  // Get user email and initials
  const email = user.email || 'user@example.com';
  const userInitials = "J";
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center justify-center h-8 w-8 rounded-full transition-all hover:ring-2 hover:ring-white/20 focus:outline-none"
          aria-label="User menu"
        >
          <GradientAvatar className="h-8 w-8">
            <GradientAvatarFallback>
              {userInitials}
            </GradientAvatarFallback>
          </GradientAvatar>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 bg-gray-900 border border-gray-800 text-white p-0 mr-2" 
        align="end"
      >
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-medium leading-none">{email.split('@')[0]}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{email}</p>
          </div>
          
          <div className="p-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleDisabledAction}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleDisabledAction}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleDisabledAction}
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark Mode
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleDisabledAction}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light Mode
            </Button>
          </div>
          
          <div className="border-t border-gray-800 p-1">
            <Button 
              onClick={handleSignOut} 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileDropdown;
