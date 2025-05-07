import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from '@/components/LineChart';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryData, RepData } from '@/types/rep-performance.types';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';
import RepSelector from './RepSelector';

interface TrendLineChartProps {
  febSummary: SummaryData;
  marchSummary: SummaryData;
  aprilSummary: SummaryData;
  maySummary: SummaryData;
  isLoading: boolean;
  repDataProp: {
    february: RepData[];
    march: RepData[];
    april: RepData[];
    may: RepData[];
  };
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  selectedUserName?: string;
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({ 
  febSummary, 
  marchSummary,
  aprilSummary,
  maySummary,
  isLoading,
  repDataProp,
  includeRetail,
  includeReva,
  includeWholesale,
  selectedUserName = 'All Data'
}) => {
  const isMobile = useIsMobile();
  const [activeMetric, setActiveMetric] = useState<'profit' | 'margin' | 'spend'>('profit');
  const [showRepComparison, setShowRepComparison] = useState(false);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const MAX_REP_SELECTIONS = 4;
  
  // Extract all unique reps from all months
  const allReps = React.useMemo(() => {
    const reps = new Set<string>();
    
    if (repDataProp) {
      Object.values(repDataProp).forEach(monthData => {
        monthData.forEach(repData => {
          if (repData.rep && repData.rep !== 'RETAIL' && repData.rep !== 'REVA' && repData.rep !== 'Wholesale') {
            reps.add(repData.rep);
          }
        });
      });
    }
    
    return Array.from(reps);
  }, [repDataProp]);
  
  // Handle rep selection 
  const toggleRepSelection = (rep: string) => {
    setSelectedReps(prev => {
      // If already selected, remove it
      if (prev.includes(rep)) {
        return prev.filter(r => r !== rep);
      }
      
      // Otherwise add it, as long as we haven't reached max
      if (prev.length < MAX_REP_SELECTIONS) {
        return [...prev, rep];
      }
      
      return prev;
    });
  };
  
  const clearRepSelection = () => {
    setSelectedReps([]);
  };
  
  // Get data for the selected metric across all months
  const chartData = React.useMemo(() => {
    const data = [
      { 
        name: 'Feb', 
        value: activeMetric === 'profit' ? febSummary.totalProfit :
               activeMetric === 'margin' ? febSummary.averageMargin : febSummary.totalSpend,
        isProjected: false 
      },
      { 
        name: 'Mar', 
        value: activeMetric === 'profit' ? marchSummary.totalProfit :
               activeMetric === 'margin' ? marchSummary.averageMargin : marchSummary.totalSpend,
        isProjected: false 
      },
      { 
        name: 'Apr', 
        value: activeMetric === 'profit' ? aprilSummary.totalProfit :
               activeMetric === 'margin' ? aprilSummary.averageMargin : aprilSummary.totalSpend,
        isProjected: false 
      },
      { 
        name: 'May', 
        value: activeMetric === 'profit' ? maySummary.totalProfit :
               activeMetric === 'margin' ? maySummary.averageMargin : maySummary.totalSpend,
        isProjected: false 
      }
    ];
    
    return data;
  }, [activeMetric, febSummary, marchSummary, aprilSummary, maySummary]);
  
  // Create rep-specific chart data
  const repChartData = React.useMemo(() => {
    if (!repDataProp || selectedReps.length === 0) return [];
    
    return selectedReps.map(rep => {
      // Find this rep in each month
      const febRep = repDataProp.february.find(r => r.rep === rep);
      const marRep = repDataProp.march.find(r => r.rep === rep);
      const aprRep = repDataProp.april.find(r => r.rep === rep);
      const mayRep = repDataProp.may.find(r => r.rep === rep);
      
      // Get the appropriate metric for each month
      const febValue = febRep ? 
        (activeMetric === 'profit' ? febRep.profit : 
         activeMetric === 'margin' ? febRep.margin : febRep.spend) : 0;
         
      const marValue = marRep ? 
        (activeMetric === 'profit' ? marRep.profit : 
         activeMetric === 'margin' ? marRep.margin : marRep.spend) : 0;
         
      const aprValue = aprRep ? 
        (activeMetric === 'profit' ? aprRep.profit : 
         activeMetric === 'margin' ? aprRep.margin : aprRep.spend) : 0;
         
      const mayValue = mayRep ? 
        (activeMetric === 'profit' ? mayRep.profit : 
         activeMetric === 'margin' ? mayRep.margin : mayRep.spend) : 0;
      
      // Return structured data for this rep
      return {
        rep,
        data: [
          { name: 'Feb', value: febValue },
          { name: 'Mar', value: marValue },
          { name: 'Apr', value: aprValue },
          { name: 'May', value: mayValue }
        ]
      };
    });
  }, [selectedReps, repDataProp, activeMetric]);
  
  // Generate colors for rep charts
  const repColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'];
  
  // Format the currency values
  const formatTrendValue = (value: number): string => {
    if (activeMetric === 'margin') {
      return `${value.toFixed(1)}%`;
    }
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}m`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(0)}k`;
    } else {
      return `£${value.toFixed(0)}`;
    }
  };
  
  // Helper function to get color based on metric
  const getMetricColor = () => {
    switch (activeMetric) {
      case 'profit':
        return '#10B981'; // Green
      case 'margin':
        return '#3B82F6'; // Blue
      case 'spend':
        return '#EC4899'; // Pink
      default:
        return '#10B981'; // Default green
    }
  };
  
  const getCardTitle = () => {
    const metricName = 
      activeMetric === 'profit' ? 'Profit' :
      activeMetric === 'margin' ? 'Margin' : 'Spend';
    
    if (selectedUserName === 'All Data') {
      return `${metricName} Trend (All Users)`;
    } else if (selectedUserName === 'My Data') {
      return `My ${metricName} Trend`;
    } else {
      return `${selectedUserName}'s ${metricName} Trend`;
    }
  };
  
  return (
    <Card className="mt-4 bg-card/30 border-white/10 shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <CardTitle className="text-lg md:text-xl text-white mb-2 md:mb-0">
            {getCardTitle()}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {!showRepComparison && (
              <>
                <Button 
                  size="sm"
                  variant={activeMetric === 'profit' ? 'default' : 'outline'} 
                  onClick={() => setActiveMetric('profit')}
                  className={activeMetric === 'profit' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-white/70 border-white/20'}
                >
                  Profit
                </Button>
                <Button 
                  size="sm"
                  variant={activeMetric === 'margin' ? 'default' : 'outline'} 
                  onClick={() => setActiveMetric('margin')}
                  className={activeMetric === 'margin' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white/70 border-white/20'}
                >
                  Margin
                </Button>
                <Button 
                  size="sm"
                  variant={activeMetric === 'spend' ? 'default' : 'outline'} 
                  onClick={() => setActiveMetric('spend')}
                  className={activeMetric === 'spend' ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'text-white/70 border-white/20'}
                >
                  Spend
                </Button>
              </>
            )}
            
            <Button 
              size="sm"
              variant="outline" 
              onClick={() => setShowRepComparison(!showRepComparison)}
              className="text-white/70 border-white/20 flex items-center"
            >
              {showRepComparison ? 'Show Summary' : 'Compare Reps'}
              <ChevronDownIcon className={`ml-1 h-4 w-4 transform transition-transform ${showRepComparison ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showRepComparison ? (
          <div className="space-y-4">
            <RepSelector
              availableReps={allReps}
              selectedReps={selectedReps}
              onSelectRep={toggleRepSelection}
              onClearSelection={clearRepSelection}
              maxSelections={MAX_REP_SELECTIONS}
            />
            
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : selectedReps.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/50">
                  Select reps above to compare their performance
                </div>
              ) : (
                <LineChart 
                  data={repChartData[0].data} 
                  color={repColors[0]}
                  showAverage={false}
                  yAxisFormatter={formatTrendValue}
                  hasPercentageMetric={activeMetric === 'margin'}
                />
              )}
            </div>
            
            {selectedReps.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {repChartData.map((repData, index) => (
                  <div 
                    key={repData.rep}
                    className="flex items-center"
                  >
                    <div 
                      className="h-3 w-3 rounded-full mr-1.5" 
                      style={{ backgroundColor: repColors[index % repColors.length] }} 
                    />
                    <span className="text-xs text-white/80">
                      {repData.rep}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <LineChart 
                data={chartData} 
                color={getMetricColor()}
                showAverage={false}
                yAxisFormatter={formatTrendValue}
                hasPercentageMetric={activeMetric === 'margin'}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendLineChart;
