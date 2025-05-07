
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center", className)}>
      <span className="font-bold italic text-xl bg-gradient-to-r from-finance-red to-finance-red/80 text-transparent bg-clip-text">a</span>
    </div>
  );
};

export default Logo;
