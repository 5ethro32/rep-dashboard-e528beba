
import React, { useState } from 'react';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Info, CircuitBoard, LoaderCircle, Plus } from "lucide-react";

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
    <div className="min-h-screen bg-finance-darkBg flex items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
      {/* Decorative cog lines background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Generate several lines with cogs */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="absolute opacity-20"
            style={{
              top: `-20px`,
              left: `${10 + i * 12}%`,
              height: '100%',
              width: '1px',
              background: 'linear-gradient(to bottom, rgba(234,56,76,0.8) 0%, transparent 80%)'
            }}
          >
            {/* Add cogs along the line */}
            {[...Array(10)].map((_, j) => (
              <div 
                key={j}
                className="absolute z-0"
                style={{
                  top: `${j * 10}%`,
                  left: '-6px',
                  opacity: 1 - (j * 0.1),
                  transform: `rotate(${j * 45}deg)`
                }}
              >
                <CircuitBoard 
                  size={j % 2 === 0 ? 14 : 10} 
                  className="text-finance-red" 
                  style={{ opacity: 1 - (j * 0.1) }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Futuristic spinning icon */}
              <div className="relative">
                <LoaderCircle className="h-16 w-16 text-finance-red animate-spin" />
                <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                {/* Decorative orbit ring */}
                <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border border-finance-red rounded-full opacity-30 animate-pulse"></div>
                <div className="absolute -top-4 -left-4 -right-4 -bottom-4 border border-white/10 rounded-full"></div>
              </div>
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
