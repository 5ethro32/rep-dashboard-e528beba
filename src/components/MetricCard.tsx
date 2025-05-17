
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import LoadingState from './metric-card/LoadingState';
import ChangeIndicator from './metric-card/ChangeIndicator';
import { FlipHorizontal } from 'lucide-react';

interface MetricCardProps {
  title: React.ReactNode;
  value: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  subtitle?: string;
  className?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  iconPosition?: 'left' | 'right';
  iconClassName?: string;
  ranking?: number;
  hideRanking?: boolean;
  details?: string;
  valueSize?: 'small' | 'medium' | 'large';
  backContent?: React.ReactNode;
  flippable?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  subtitle,
  className,
  valueClassName,
  icon,
  isLoading = false,
  iconPosition = 'right',
  iconClassName,
  ranking,
  hideRanking = false,
  details,
  valueSize = 'large',
  backContent,
  flippable = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Helper function to get ranking badge styles
  const getRankingBadgeStyles = (rank?: number) => {
    if (!rank || rank > 3) return null;
    
    switch(rank) {
      case 1: return "bg-amber-500 text-black"; // Gold
      case 2: return "bg-gray-300 text-black";  // Silver
      case 3: return "bg-amber-700 text-white"; // Bronze
      default: return "bg-gray-800 text-white/60";
    }
  };

  // Helper function to get value size class
  const getValueSizeClass = (size: string) => {
    switch(size) {
      case 'small': return 'text-xl md:text-2xl';
      case 'medium': return 'text-2xl md:text-3xl';
      case 'large': return 'text-3xl md:text-4xl';
      default: return 'text-3xl md:text-4xl';
    }
  };
  
  const handleCardClick = () => {
    if (flippable) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div 
      className={cn(
        "relative transition-all duration-500",
        flippable ? "perspective-1000" : "",
        className
      )}
      style={{ perspective: flippable ? '1000px' : 'none' }}
    >
      <Card 
        className={cn(
          "border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm shadow-lg",
          "transition-all duration-500 ease-in-out",
          "hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)]",
          "will-change-transform relative h-full",
          flippable ? "cursor-pointer transform-style-preserve-3d group" : "",
          flippable && isFlipped ? "rotate-y-180" : "",
          className
        )}
        onClick={handleCardClick}
        style={{
          transformStyle: flippable ? 'preserve-3d' : 'flat',
          transform: flippable && isFlipped ? 'rotateY(180deg)' : 'none'
        }}
      >
        {/* Front of card */}
        <CardContent 
          className={cn(
            "p-4 md:p-5 relative overflow-hidden",
            flippable ? "backface-hidden" : ""
          )}
          style={{
            backfaceVisibility: flippable ? 'hidden' : 'visible'
          }}
        >
          {/* Top section with title and icon */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </div>
            
            {icon && iconPosition === 'right' && (
              <div className={cn(
                "flex-shrink-0 text-muted-foreground",
                iconClassName
              )}>
                {React.cloneElement(icon as React.ReactElement, { size: 16 })}
              </div>
            )}
          </div>
          
          {/* Middle section with value and change indicator */}
          <div className="flex items-baseline gap-x-3">
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                {icon && iconPosition === 'left' && (
                  <div className={cn(
                    "flex-shrink-0 text-muted-foreground mr-2",
                    iconClassName
                  )}>
                    {React.cloneElement(icon as React.ReactElement, { size: 16 })}
                  </div>
                )}
                
                <div className={cn(getValueSizeClass(valueSize), "font-bold", valueClassName)}>
                  {value}
                </div>
                
                {change && <ChangeIndicator type={change.type} value={change.value} />}
              </>
            )}
          </div>
          
          {/* Bottom section with subtitle or details */}
          {subtitle && !isLoading && (
            <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
          )}
          
          {details && !isLoading && (
            <div className="text-xs text-muted-foreground mt-2">{details}</div>
          )}
          
          {/* Ranking badge - only show for ranks 1-3 with gold/silver/bronze styling */}
          {ranking !== undefined && ranking <= 3 && !isLoading && !hideRanking && (
            <div className={cn(
              "absolute bottom-2 right-2 rounded-full w-7 h-7 flex items-center justify-center",
              "shadow-md border border-white/20",
              getRankingBadgeStyles(ranking)
            )}>
              <span className="text-xs font-bold">{ranking}</span>
            </div>
          )}

          {flippable && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-white/60">
              <span>Flip</span>
              <FlipHorizontal className="h-3 w-3" />
            </div>
          )}
        </CardContent>

        {/* Back of card - with proper content orientation */}
        {flippable && (
          <CardContent 
            className="p-4 md:p-5 absolute top-0 left-0 w-full h-full backface-hidden rotate-y-180 flex flex-col bg-gradient-to-b from-gray-950 to-gray-900"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {title} Details
            </div>
            
            <div className="flex-grow flex items-center justify-center">
              {backContent ? (
                <div className="w-full h-full">{backContent}</div>
              ) : (
                <div className="text-sm text-muted-foreground text-center">
                  Additional insights coming soon
                </div>
              )}
            </div>
            
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-white/60">
              <span>Flip</span>
              <FlipHorizontal className="h-3 w-3" />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MetricCard;
