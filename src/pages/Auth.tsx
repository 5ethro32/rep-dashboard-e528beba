
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, LogIn, UserPlus, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Check if user is coming from password reset email
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    if (accessToken && refreshToken && type === 'recovery') {
      // User clicked password reset link
      setIsResetPassword(true);
      setIsForgotPassword(false);
      setIsLogin(false);
      
      // Set the session with the tokens from URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }
  }, [searchParams]);

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
          title: "Registration successful!",
          description: "Please check your email for verification link.",
        });
        
        // Set registration success state to true
        setRegistrationSuccess(true);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate password match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been reset. You can now sign in with your new password.",
      });
      
      // Reset form and redirect to login
      setIsResetPassword(false);
      setIsLogin(true);
      setPassword('');
      setConfirmPassword('');
      
      // Clear URL parameters
      navigate('/auth', { replace: true });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
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
    setConfirmPassword('');
    setIsForgotPassword(false);
    setIsResetPassword(false);
    setRegistrationSuccess(false);
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setPassword('');
    setConfirmPassword('');
    setIsResetPassword(false);
    setRegistrationSuccess(false);
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
              {isResetPassword ? "Set New Password" : (isForgotPassword ? "Reset Password" : (isLogin ? 'Sign In' : 'Create Account'))}
            </CardTitle>
            <CardDescription className="text-finance-gray">
              {isResetPassword ? "Enter your new password below" : "Only avergenerics.co.uk email addresses are allowed"}
            </CardDescription>
          </CardHeader>
          
          {/* Show email verification message when registration is successful */}
          {registrationSuccess && (
            <div className="px-6 pb-4">
              <Alert className="bg-green-800/30 border-green-500/50 text-white mb-4">
                <Mail className="h-4 w-4 mr-2" />
                <AlertDescription className="text-sm">
                  <strong>Registration successful!</strong> Please check your email for a verification link. 
                  You need to verify your email before you can log in.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {isResetPassword ? (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-white">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="new-password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter new password" 
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm new password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-gray-800 border-white/10 text-white pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-finance-red hover:bg-finance-red/80 text-white" 
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                  {!loading && <Lock className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </form>
          ) : isForgotPassword ? (
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
