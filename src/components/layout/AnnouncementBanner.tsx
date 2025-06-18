import React, { useState } from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { defaultRepChanges } from '@/data/rep-performance-default-data';

// Interface for rep changes data
interface RepChangesData {
  [repName: string]: {
    profit: number;
    spend: number;
    margin: number;
    packs: number;
    activeAccounts: number;
    totalAccounts: number;
  };
}

interface AnnouncementBannerProps {
  className?: string;
  repChangesData?: RepChangesData;
  currentMonth?: string;
}

// Generate initials from name
const generateSymbol = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Convert rep changes to ticker format - June vs June_Data_Comparison profit comparison
const getTickerData = (repChanges: RepChangesData) => {
  const profitChanges: Array<{name: string; change: number; symbol: string}> = [];
  
  Object.entries(repChanges).forEach(([name, changes]) => {
    // Only use profit changes and only include significant changes (absolute value > 1%)
    const profitChange = changes.profit;
    if (Math.abs(profitChange) > 1) {
      profitChanges.push({
        name,
        change: profitChange,
        symbol: generateSymbol(name)
      });
    }
  });
  
  // Sort by absolute change value (most significant first)
  return profitChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
};

// Format change percentage
const formatChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// Get color class for change - more beautiful colors
const getChangeColor = (change: number): string => {
  if (change > 0) return 'text-emerald-400';
  if (change < 0) return 'text-rose-400';
  return 'text-slate-400';
};

// Get icon for change
const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-3 w-3" />;
  if (change < 0) return <TrendingDown className="h-3 w-3" />;
  return null;
};

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ 
  className,
  repChangesData,
  currentMonth = 'June'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Use live data if available, otherwise fall back to default data
  const dataToUse = repChangesData && Object.keys(repChangesData).length > 0 ? repChangesData : defaultRepChanges;
  
  // Get the ticker data
  const tickerData = getTickerData(dataToUse);

  // Don't render if not visible
  if (!isVisible) return null;
  
  // If no significant changes, show a more elegant placeholder
  if (tickerData.length === 0) {
    return (
      <div className={cn(
        "bg-gradient-to-r from-gray-950/80 via-gray-900/90 to-gray-950/80 border-b border-white/5 backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center justify-between px-6 py-2.5">
          <div className="flex items-center gap-3 mr-4 flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white/80 tracking-wide">LIVE</span>
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm text-white/50 font-light">Market stable • No significant movements</span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1.5 ml-4 text-white/40 hover:text-white/70 transition-all duration-200 hover:bg-white/5 rounded"
            aria-label="Close announcement banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-gradient-to-r from-gray-950/80 via-gray-900/90 to-gray-950/80 border-b border-white/5 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center justify-between px-6 py-2.5 max-w-full overflow-hidden">
        {/* Live indicator */}
        <div className="flex items-center gap-3 mr-6 flex-shrink-0">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-white/80 tracking-wide hidden sm:inline">LIVE</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-8 animate-scroll whitespace-nowrap">
            {/* Duplicate the array for seamless scrolling */}
            {[...tickerData, ...tickerData, ...tickerData].map((item, index) => (
              <div key={`${item.symbol}-${index}`} className="flex items-center gap-3 text-sm">
                {/* Symbol - more elegant styling */}
                <span className="font-display font-semibold text-white/95 text-xs bg-gradient-to-r from-white/10 to-white/5 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-sm">
                  {item.symbol}
                </span>
                
                {/* Change indicator */}
                <div className={cn("flex items-center gap-1.5", getChangeColor(item.change))}>
                  {getChangeIcon(item.change)}
                  <span className="font-semibold text-sm">
                    {formatChange(item.change)}
                  </span>
                </div>
                
                {/* Name (hidden on mobile) - more subtle */}
                <span className="text-white/40 text-xs hidden lg:inline truncate max-w-28 font-light">
                  {item.name}
                </span>
                
                {/* Separator dot */}
                <div className="w-1 h-1 bg-white/20 rounded-full hidden xl:block" />
              </div>
            ))}
          </div>
          
          {/* Fade edges for seamless effect */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-950/80 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950/80 to-transparent pointer-events-none" />
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1.5 ml-6 text-white/40 hover:text-white/70 transition-all duration-200 hover:bg-white/5 rounded"
          aria-label="Close announcement banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner; 