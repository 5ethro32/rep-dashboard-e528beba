import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PerformanceTable from './PerformanceTable';
import RepProfitChart from '@/components/RepProfitChart';
import RepProfitShare from '@/components/RepProfitShare';
import RepMarginComparison from '@/components/RepMarginComparison';
import DepartmentProfitShare from '@/components/DepartmentProfitShare';
import { useIsMobile } from '@/hooks/use-mobile';
import { useComparisonData } from '@/hooks/useComparisonData';

interface PerformanceContentProps {
  tabValues: string[];
  getActiveData: (tabValue: string) => any[];
  sortData: (data: any[]) => any[];
  sortBy: string;
  sortOrder: string;
  handleSort: (column: string) => void;
  repChanges: Record<string, any>;
  formatCurrency: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
  formatNumber: (value: number) => string;
  renderChangeIndicator: (changeValue: number, size?: string, metricType?: string, repName?: string, metricValue?: number) => React.ReactNode;
  isLoading?: boolean;
  getFebValue: (repName: string, metricType: string, currentValue: number, changePercent: number) => string;
  selectedMonth: string;
  summary?: {
    totalSpend?: number;
    totalProfit?: number;
    totalPacks?: number;
    averageMargin?: number;
    totalAccounts?: number;
    activeAccounts?: number;
  };
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  baseSummary?: {
    totalProfit: number;
  };
  revaValues?: {
    totalProfit: number;
  };
  wholesaleValues?: {
    totalProfit: number;
  };
  aprRepData: any[];
  marchRepData: any[];
  febRepData: any[];
  aprRevaRepData: any[];
  marchRevaRepData: any[];
  febRevaRepData: any[];
  aprWholesaleRepData: any[];
  marchWholesaleRepData: any[];
  febWholesaleRepData: any[];
  marchRollingRetailData?: RepData[];
  marchRollingRevaData?: RepData[];
  marchRollingWholesaleData?: RepData[];
}

const PerformanceContent: React.FC<PerformanceContentProps> = ({
  tabValues,
  getActiveData,
  sortData,
  sortBy,
  sortOrder,
  handleSort,
  repChanges,
  formatCurrency,
  formatPercent,
  formatNumber,
  renderChangeIndicator,
  isLoading,
  getFebValue,
  selectedMonth,
  summary,
  includeRetail,
  includeReva,
  includeWholesale,
  baseSummary,
  revaValues,
  wholesaleValues,
  aprRepData,
  marchRepData,
  febRepData,
  aprRevaRepData,
  marchRevaRepData,
  febRevaRepData,
  aprWholesaleRepData,
  marchWholesaleRepData,
  febWholesaleRepData,
  marchRollingRetailData,
  marchRollingRevaData,
  marchRollingWholesaleData
}) => {
  const isMobile = useIsMobile();
  
  const { getCurrentAndPreviousData } = useComparisonData(
    selectedMonth,
    aprRepData,
    marchRepData,
    febRepData,
    aprRevaRepData,
    marchRevaRepData,
    febRevaRepData,
    aprWholesaleRepData,
    marchWholesaleRepData,
    febWholesaleRepData,
    marchRollingRetailData,
    marchRollingRevaData,
    marchRollingWholesaleData
  );

  React.useEffect(() => {
    if (selectedMonth && (aprRepData || marchRepData || febRepData)) {
      console.log(`PerformanceContent: Debugging comparison data for ${selectedMonth}`);
      tabValues.forEach(tab => {
        const { currentData, previousData } = getCurrentAndPreviousData(tab);
        console.log(`Tab: ${tab}, Current data: ${currentData.length}, Previous data: ${previousData.length}`);
      });
    }
  }, [selectedMonth, aprRepData, marchRepData, febRepData, tabValues]);

  const getTabLabel = (tabValue: string) => {
    switch (tabValue) {
      case 'overall': return 'Overall';
      case 'rep': return 'Retail';
      case 'reva': return 'REVA';
      case 'wholesale': return 'Wholesale';
      default: return tabValue;
    }
  };

  const getTabTitle = (tabValue: string, selectedMonth: string) => {
    switch (tabValue) {
      case 'overall': return `Overall Rep Performance (${selectedMonth} 2025)`;
      case 'rep': return `Retail Performance (${selectedMonth} 2025)`;
      case 'reva': return `REVA Performance (${selectedMonth} 2025)`;
      case 'wholesale': return `Wholesale Performance (${selectedMonth} 2025)`;
      default: return '';
    }
  };

  const getTabDescription = (tabValue: string) => {
    switch (tabValue) {
      case 'overall': 
        return 'Showing retail data with REVA and wholesale data combined into rep totals.';
      case 'rep': 
        return 'Showing retail data only, excluding REVA and wholesale.';
      case 'reva': 
        return 'Showing REVA data by rep.';
      case 'wholesale': 
        return 'Showing wholesale data by rep.';
      default: 
        return '';
    }
  };

  const showChangeIndicators = selectedMonth !== 'February';

  return (
    <div className="mb-8 animate-slide-in-up">
      <Tabs defaultValue="overall" className="w-full">
        <TabsList className={`${isMobile ? 'flex flex-wrap' : 'grid grid-cols-4'} mb-6 md:mb-8 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/5 shadow-lg p-1`}>
          {tabValues.map((tabValue) => (
            <TabsTrigger 
              key={tabValue}
              value={tabValue} 
              className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2"
            >
              {getTabLabel(tabValue)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabValues.map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-0">
            <div className="bg-gray-900/40 rounded-lg border border-white/10 mb-6 md:mb-8 backdrop-blur-sm shadow-lg">
              <div className="p-3 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-white/90">
                  {getTabTitle(tabValue, selectedMonth)}
                </h2>
                <p className="text-xs md:text-sm mb-3 md:mb-4 text-white/60">
                  {getTabDescription(tabValue)}
                  {selectedMonth === 'February' && (
                    <span className="ml-1 text-finance-gray italic">No comparison data available for January.</span>
                  )}
                </p>
                
                <PerformanceTable 
                  displayData={sortData(getActiveData(tabValue))}
                  repChanges={repChanges}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                  formatNumber={formatNumber}
                  renderChangeIndicator={showChangeIndicators ? renderChangeIndicator : () => null}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                  previousMonthData={getCurrentAndPreviousData(tabValue).previousData}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div className="h-64 md:h-80">
                <RepProfitChart 
                  displayData={sortData(getActiveData(tabValue))}
                  repChanges={repChanges}
                  formatCurrency={formatCurrency}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                />
              </div>
              
              <div className="h-64 md:h-80">
                <RepMarginComparison
                  displayData={sortData(getActiveData(tabValue))}
                  repChanges={repChanges}
                  formatPercent={formatPercent}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              <div className="h-80 md:h-96">
                <RepProfitShare 
                  displayData={sortData(getActiveData(tabValue))}
                  repChanges={repChanges}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                  totalProfit={tabValue === 'overall' && selectedMonth === 'April' ? summary?.totalProfit : undefined}
                />
              </div>
              
              <div className="h-80 md:h-96">
                <DepartmentProfitShare 
                  retailProfit={(includeRetail && baseSummary?.totalProfit) || 0}
                  revaProfit={(includeReva && revaValues?.totalProfit) || 0}
                  wholesaleProfit={(includeWholesale && wholesaleValues?.totalProfit) || 0}
                  totalProfit={summary?.totalProfit || 0}
                  includeRetail={includeRetail}
                  includeReva={includeReva}
                  includeWholesale={includeWholesale}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PerformanceContent;
