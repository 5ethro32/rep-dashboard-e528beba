import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Helper function to generate initials from email or name
const generateInitials = (email: string): string => {
  if (!email) return 'U';
  
  // Extract username from email (part before @)
  const username = email.split('@')[0];
  
  // Split by common separators and take first letter of each part
  const parts = username.split(/[._-]/).filter(part => part.length > 0);
  
  if (parts.length > 1) {
    // If multiple parts, take first letter of first two parts
    return parts
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  } else {
    // If single part, take first letter
    return username.charAt(0).toUpperCase();
  }
};

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
  
  // Generate proper initials from user's email
  const userInitials = generateInitials(user.email || '');
  
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
