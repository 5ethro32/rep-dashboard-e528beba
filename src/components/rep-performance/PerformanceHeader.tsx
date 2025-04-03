
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PerformanceHeader: React.FC = () => {
  return (
    <header className="py-8 md:py-16 px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent">
      <div className="flex justify-between items-center mb-4">
        <Link to="/">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 transition-all duration-300">
            <Home className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
            <span className="text-sm md:text-base">Back</span>
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
        Rep
        <br />
        Perform<span className="font-normal italic">a</span>nce
        <br />
        <span className="text-finance-red">Dashboard</span>
      </h1>
      <div className="mt-4 md:mt-8 text-right">
        <span className="text-lg md:text-xl lg:text-2xl text-white/80">March 2025</span>
      </div>
    </header>
  );
};

export default PerformanceHeader;
