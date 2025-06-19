import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, TrendingDown, X, ChevronDown } from 'lucide-react';
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

// Available metrics to display
type MetricType = 'profit' | 'spend' | 'margin';

const METRIC_CONFIG = {
  profit: { label: 'PROFIT', color: 'text-emerald-400' },
  spend: { label: 'SPEND', color: 'text-blue-400' },
  margin: { label: 'MARGIN', color: 'text-purple-400' }
};

// Generate initials from name
const generateSymbol = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Convert rep changes to ticker format - June vs June_Data_Comparison comparison for any metric
const getTickerData = (repChanges: RepChangesData, selectedMetric: MetricType) => {
  const metricChanges: Array<{name: string; change: number; symbol: string}> = [];
  
  Object.entries(repChanges).forEach(([name, changes]) => {
    // Use the selected metric instead of hardcoded profit
    const metricChange = changes[selectedMetric];
    
    // Only include significant changes (absolute value > 1%)
    if (Math.abs(metricChange) > 1) {
      metricChanges.push({
        name,
        change: metricChange,
        symbol: generateSymbol(name)
      });
    }
  });
  
  // Sort by absolute change value (most significant first)
  const sortedChanges = metricChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  console.log('🎯 TICKER DATA - Metric:', selectedMetric, '| Found', sortedChanges.length, 'significant changes');
  
  return sortedChanges;
};

// Format change percentage
const formatChange = (change: number, metric: MetricType): string => {
  const sign = change >= 0 ? '+' : '';
  if (metric === 'margin') {
    // Margin is already in percentage points, so just show the value
    return `${sign}${change.toFixed(1)}pp`;
  }
  // Profit and spend are percentage changes
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
  // Initialize selectedMetric from sessionStorage to persist across re-renders
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(() => {
    const saved = sessionStorage.getItem('announcement-banner-metric');
    const metric = (saved && ['profit', 'spend', 'margin'].includes(saved)) ? saved as MetricType : 'profit';
    console.log('🎯 BANNER INITIALIZATION - Loading saved metric:', saved, '-> Using:', metric);
    return metric;
  });
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Persist selectedMetric to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('announcement-banner-metric', selectedMetric);
  }, [selectedMetric]);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showMetricSelector && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap
        left: rect.left
      });
    }
  }, [showMetricSelector]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMetricSelector && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowMetricSelector(false);
      }
    };

    if (showMetricSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMetricSelector]);

  // Use live data if available, otherwise fall back to default data
  const dataToUse = repChangesData && Object.keys(repChangesData).length > 0 ? repChangesData : defaultRepChanges;
  
  // Add debugging for June data and Michael McKay specifically
  if (currentMonth === 'June') {
    console.log('🎯 ANNOUNCEMENT BANNER - JUNE DEBUGGING:');
    console.log('Current month:', currentMonth);
    console.log('Received repChangesData:', repChangesData);
    console.log('repChangesData keys count:', repChangesData ? Object.keys(repChangesData).length : 0);
    console.log('Using default data?', !repChangesData || Object.keys(repChangesData).length === 0);
    console.log('dataToUse === defaultRepChanges?', dataToUse === defaultRepChanges);
    console.log('Michael McKay data in received data:', repChangesData?.['Michael McKay']);
    console.log('Michael McKay data in default data:', defaultRepChanges['Michael McKay']);
    console.log('Michael McKay data being used:', dataToUse['Michael McKay']);
  }
  
  // Get the ticker data for the selected metric
  const tickerData = getTickerData(dataToUse, selectedMetric);
  
  // Debug ticker data generation (simplified)
  console.log('🎯 ANNOUNCEMENT BANNER RENDER - Selected metric:', selectedMetric, '| Ticker items:', tickerData.length);

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
            <span className="text-xs font-medium text-white/80 tracking-wide">{METRIC_CONFIG[selectedMetric].label}</span>
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
    <>
      <div className={cn(
        "bg-gradient-to-r from-gray-950/80 via-gray-900/90 to-gray-950/80 border-b border-white/5 backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center justify-between px-6 py-2.5 max-w-full overflow-hidden">
          {/* Metric selector */}
          <div className="flex items-center gap-3 mr-6 flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <button
              ref={buttonRef}
              onClick={() => {
                console.log('🎯 DROPDOWN TRIGGER - Button clicked, current showMetricSelector:', showMetricSelector);
                setShowMetricSelector(!showMetricSelector);
                console.log('🎯 DROPDOWN TRIGGER - Setting showMetricSelector to:', !showMetricSelector);
              }}
              className={cn(
                "text-xs font-medium tracking-wide hidden sm:flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200 hover:bg-white/5",
                METRIC_CONFIG[selectedMetric].color
              )}
            >
              {METRIC_CONFIG[selectedMetric].label}
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showMetricSelector && "rotate-180")} />
            </button>
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
                      {formatChange(item.change, selectedMetric)}
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

      {/* Portal-rendered dropdown to escape container constraints */}
      {showMetricSelector && (() => {
        console.log('🎯 DROPDOWN PORTAL - Creating portal dropdown, position:', dropdownPosition);
        return createPortal(
          <div 
            className="fixed bg-gray-900 border border-white/10 rounded-md shadow-xl backdrop-blur-md z-[9999] min-w-[6rem]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
            onMouseDown={() => console.log('🎯 DROPDOWN PORTAL - Mouse down on dropdown container')}
          >
            {(Object.keys(METRIC_CONFIG) as MetricType[]).map((metric) => {
              console.log('🎯 DROPDOWN PORTAL - Rendering button for metric:', metric);
              return (
                <button
                  key={metric}
                  onMouseDown={() => console.log('🎯 DROPDOWN PORTAL - Mouse down on button:', metric)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 METRIC CHANGE CLICKED:', metric);
                    console.log('Previous metric:', selectedMetric);
                    console.log('Setting metric to:', metric);
                    setSelectedMetric(metric);
                    setShowMetricSelector(false);
                    console.log('Metric state updated');
                    
                    // Force immediate storage update and verification
                    sessionStorage.setItem('announcement-banner-metric', metric);
                    console.log('SessionStorage updated to:', sessionStorage.getItem('announcement-banner-metric'));
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-xs text-left hover:bg-white/5 first:rounded-t-md last:rounded-b-md transition-colors",
                    selectedMetric === metric ? METRIC_CONFIG[metric].color : 'text-white/60'
                  )}
                >
                  {METRIC_CONFIG[metric].label}
                </button>
              );
            })}
          </div>,
          document.body
        );
      })()}
    </>
  );
};

export default AnnouncementBanner; 