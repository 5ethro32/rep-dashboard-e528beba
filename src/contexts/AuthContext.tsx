
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin?: boolean; // Added to identify admin users
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Function to check if user has admin role using security definer function
  const checkUserRole = async (userId: string) => {
    try {
      console.log('Checking role for user:', userId);
      
      // First try using our security definer function via RPC
      const { data: roleData, error: fnError } = await supabase
        .rpc('get_current_user_role');
        
      if (!fnError && roleData) {
        const isUserAdmin = roleData === 'admin';
        console.log('AuthContext: Role from function:', roleData, 'isAdmin:', isUserAdmin);
        setIsAdmin(isUserAdmin);
        return;
      }
      
      if (fnError) {
        console.warn('Function check failed, falling back to direct query:', fnError.message);
      }
      
      // Fall back to direct query if function call fails
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        return;
      }
      
      const isUserAdmin = data?.role === 'admin';
      console.log('AuthContext: User role check result:', data?.role, 'isAdmin:', isUserAdmin);
      setIsAdmin(isUserAdmin);
    } catch (err) {
      console.error('Error checking user role:', err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check if user has admin role
        if (currentSession?.user) {
          checkUserRole(currentSession.user.id);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Check if user has admin role
      if (currentSession?.user) {
        checkUserRole(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clean up auth state
    localStorage.removeItem('supabase.auth.token');
    
    // Remove all Supabase auth keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Same for sessionStorage if used
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Attempt global sign out
    await supabase.auth.signOut({ scope: 'global' });
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
