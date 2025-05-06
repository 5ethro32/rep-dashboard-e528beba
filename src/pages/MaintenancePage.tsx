
import React, { useState, useEffect } from 'react';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Info, Shield, Plus, Cog } from "lucide-react";
import { GradientAvatar, GradientAvatarFallback } from "@/components/ui/gradient-avatar";

const MaintenancePage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { bypassMaintenance } = useMaintenance();
  const { toast } = useToast();
  const [cogLines, setCogLines] = useState<Array<{id: number, x: number, size: number, speed: number, rotation: number}>>([]);

  // Generate cog lines on component mount
  useEffect(() => {
    const numberOfCogs = 12;
    const newCogLines = Array.from({ length: numberOfCogs }).map((_, index) => ({
      id: index,
      x: Math.random() * 100, // Random horizontal position (percentage)
      size: 10 + Math.random() * 20, // Random size between 10-30px
      speed: 1 + Math.random() * 3, // Random speed for vertical movement
      rotation: Math.random() * 360, // Initial rotation
    }));
    setCogLines(newCogLines);
  }, []);

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
    <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated cog lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {cogLines.map((cog) => (
          <div 
            key={cog.id} 
            className="absolute"
            style={{
              left: `${cog.x}%`,
              top: '-50px',
              animation: `cogFall ${cog.speed}s linear infinite, cogSpin ${cog.speed * 2}s linear infinite`,
              opacity: 0.4,
              animationDelay: `${cog.id * 0.2}s`
            }}
          >
            <Cog 
              size={cog.size} 
              className="text-finance-red/20" 
              style={{ transform: `rotate(${cog.rotation}deg)` }}
              strokeWidth={1} 
            />
          </div>
        ))}
      </div>
      
      {/* Digital circuit background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c14] to-[#15151f]">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute h-px w-1/3 bg-gradient-to-r from-transparent via-finance-red/50 to-transparent top-1/4 left-0"></div>
          <div className="absolute h-px w-1/4 bg-gradient-to-r from-transparent via-finance-red/30 to-transparent top-1/3 right-0"></div>
          <div className="absolute h-px w-1/5 bg-gradient-to-r from-transparent via-finance-red/20 to-transparent top-1/2 left-1/4"></div>
          <div className="absolute w-px h-1/3 bg-gradient-to-b from-transparent via-finance-red/40 to-transparent top-0 left-1/3"></div>
          <div className="absolute w-px h-1/4 bg-gradient-to-b from-transparent via-finance-red/30 to-transparent top-1/4 right-1/3"></div>
          <div className="absolute w-px h-1/5 bg-gradient-to-b from-transparent via-finance-red/20 to-transparent top-0 right-1/4"></div>
        </div>
      </div>
      
      <div className="w-full max-w-md space-y-6 animate-fade-in relative">
        {/* Horizontal connection lines with cogs that fade toward the center */}
        <div className="absolute top-16 left-0 w-full h-px">
          <div className="absolute h-px w-full bg-gradient-to-r from-finance-red/30 via-transparent to-finance-red/30"></div>
          <Cog size={16} className="absolute -left-2 -top-2 text-finance-red/60 animate-spin-slow" strokeWidth={1} />
          <Cog size={16} className="absolute -right-2 -top-2 text-finance-red/60 animate-spin-slow" strokeWidth={1} style={{ animationDirection: 'reverse' }} />
        </div>
        
        <div className="absolute top-20 left-1/4 w-1/2 h-px">
          <div className="absolute h-px w-full bg-gradient-to-r from-finance-red/20 via-transparent to-finance-red/20"></div>
          <Cog size={12} className="absolute -left-1.5 -top-1.5 text-finance-red/40 animate-spin-slow" strokeWidth={1} />
          <Cog size={12} className="absolute -right-1.5 -top-1.5 text-finance-red/40 animate-spin-slow" strokeWidth={1} style={{ animationDirection: 'reverse' }} />
        </div>
        
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="text-finance-red">Down</span> for Maintenance
          </h1>
          <p className="text-[#8E9196] mb-6">We're currently performing scheduled system updates.</p>
        </div>

        <Card className="border border-[#2a2a3c] bg-[#171724]/70 backdrop-blur-sm text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl font-bold text-white">
              <Lock className="mr-2 h-5 w-5 text-finance-red" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter the maintenance password to proceed"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#1e1e2d] border-[#2a2a3c] text-white"
                  />
                </div>
                
                <div className="flex items-start gap-2 p-3 rounded-md bg-[#1e1e2d]/70 border border-[#2a2a3c]">
                  <Info className="h-5 w-5 text-[#8E9196] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#8E9196]">
                    The system is currently undergoing scheduled maintenance. Regular users will not be able to access the application until maintenance is complete.
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
                {isSubmitting ? "Authenticating..." : "Access System"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Futuristic maintenance icon with plus instead of lightning */}
        <div className="absolute -top-16 -right-6 lg:right-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-finance-red/40 to-rose-600/20 rounded-full blur-lg"></div>
            <GradientAvatar className="h-20 w-20 border-2 border-white/10 shadow-lg relative">
              <GradientAvatarFallback className="flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center animate-pulse opacity-50">
                  <Shield className="h-10 w-10 text-white/30" />
                </div>
                <Plus className="h-8 w-8 text-white relative z-10" strokeWidth={2} />
              </GradientAvatarFallback>
            </GradientAvatar>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
