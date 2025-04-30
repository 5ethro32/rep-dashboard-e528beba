
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Add email domain validation before attempting signup or login
      if (!email.toLowerCase().endsWith('@avergenerics.co.uk')) {
        throw new Error('Only avergenerics.co.uk email addresses are allowed.');
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast({
          title: "Success!",
          description: "You have successfully signed in.",
        });
        navigate('/rep-performance');
        
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Success!",
          description: "Registration successful. Please check your email for verification.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Add email domain validation before attempting password reset
      if (!email.toLowerCase().endsWith('@avergenerics.co.uk')) {
        throw new Error('Only avergenerics.co.uk email addresses are allowed.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for a password reset link.",
      });
      
      // Reset to login view
      setIsForgotPassword(false);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setIsForgotPassword(false);
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-finance-darkBg text-white flex items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            S<span className="text-finance-red italic -ml-1">a</span>les Performance
          </h1>
          <p className="text-finance-gray">Secure access to sales data</p>
        </div>
        
        <Card className="border border-white/10 bg-gray-900/70 backdrop-blur-sm text-white">
          <CardHeader>
            <CardTitle>
              {isForgotPassword ? "Reset Password" : (isLogin ? 'Sign In' : 'Create Account')}
            </CardTitle>
            <CardDescription className="text-finance-gray">
              Only avergenerics.co.uk email addresses are allowed
            </CardDescription>
          </CardHeader>
          
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white">Email</Label>
                  <Input 
                    id="reset-email"
                    type="email" 
                    placeholder="name@avergenerics.co.uk" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-800 border-white/10 text-white"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-finance-red hover:bg-finance-red/80 text-white" 
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Send Reset Link"}
                </Button>
                <p className="text-center text-finance-gray text-sm">
                  <button
                    type="button"
                    onClick={toggleForgotPassword}
                    className="text-finance-red hover:underline ml-1"
                  >
                    Back to Sign In
                  </button>
                </p>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="name@avergenerics.co.uk" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-800 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-800 border-white/10 text-white pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={toggleForgotPassword}
                        className="text-sm text-finance-red hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-finance-red hover:bg-finance-red/80 text-white" 
                  disabled={loading}
                >
                  {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
                  {!loading && (isLogin ? <LogIn className="ml-2 h-4 w-4" /> : <UserPlus className="ml-2 h-4 w-4" />)}
                </Button>
                <p className="text-center text-finance-gray text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"} 
                  <button
                    type="button"
                    onClick={toggleView}
                    className="text-finance-red hover:underline ml-1"
                  >
                    {isLogin ? "Register" : "Sign In"}
                  </button>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
