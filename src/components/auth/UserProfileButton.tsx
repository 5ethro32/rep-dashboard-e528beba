
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const UserProfileButton = () => {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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
    }
  };
  
  if (!user) return null;
  
  // Just use the initial without displaying email
  const userInitials = "J";
  
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-9 w-9 border border-white/10 bg-finance-red text-white">
        <AvatarFallback className="bg-finance-red text-white">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <Button 
        onClick={handleSignOut} 
        variant="ghost" 
        size="sm"
        className="text-white hover:bg-white/10"
        disabled={isSigningOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {!isMobile && (isSigningOut ? 'Signing out...' : 'Sign out')}
      </Button>
    </div>
  );
};

export default UserProfileButton;
