
import React, { useState } from 'react';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Info, AlertTriangle, Settings } from "lucide-react";

const MaintenancePage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { bypassMaintenance } = useMaintenance();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // The hardcoded password check
    setTimeout(() => {
      if (password === 'Soley2026!') {
        toast({
          title: "Access granted",
          description: "You now have access to the application.",
        });
        
        // Important: Clear the form and invoke the bypass function
        setPassword('');
        bypassMaintenance();
      } else {
        toast({
          title: "Invalid password",
          description: "Please try again with the correct password.",
          variant: "destructive",
        });
      }
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-finance-darkBg flex items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Settings className="h-16 w-16 text-finance-red animate-spin-slow" />
              <AlertTriangle className="h-8 w-8 text-finance-red absolute top-4 left-4" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
            <span className="text-finance-red">Down</span> for Maintenance
          </h1>
          <p className="text-finance-gray mb-6">We're currently performing scheduled system updates.</p>
        </div>

        <Card className="border border-white/10 bg-gray-900/70 backdrop-blur-sm text-white glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5 text-finance-red" />
              Admin Access
            </CardTitle>
            <CardDescription className="text-finance-gray">
              Enter the maintenance password to proceed
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-white/10 text-white pr-10"
                  />
                </div>
                
                <div className="flex items-start gap-2 p-3 rounded-md bg-gray-800/50 border border-white/5">
                  <Info className="h-5 w-5 text-finance-gray flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-finance-gray">
                    The system is currently undergoing scheduled maintenance. 
                    Regular users will not be able to access the application until maintenance is complete.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit"
                className="w-full bg-finance-red hover:bg-finance-red/80 text-white" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Access System"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default MaintenancePage;
