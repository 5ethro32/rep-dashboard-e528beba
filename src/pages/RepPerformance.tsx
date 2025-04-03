import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { calculateSummary, formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const defaultOverallData = [
  { rep: "Clare Quinn", spend: 174152.39, profit: 22951.81, margin: 13.18, packs: 105432, activeAccounts: 42, totalAccounts: 81, profitPerActiveShop: 546.47, profitPerPack: 0.22, activeRatio: 51.85 },
  { rep: "Craig McDowall", spend: 607269.54, profit: 75999.24, margin: 12.51, packs: 327729, activeAccounts: 127, totalAccounts: 291, profitPerActiveShop: 598.42, profitPerPack: 0.23, activeRatio: 43.64 },
  { rep: "Ged Thomas", spend: 186126.64, profit: 37837.48, margin: 20.33, packs: 122874, activeAccounts: 70, totalAccounts: 95, profitPerActiveShop: 540.54, profitPerPack: 0.31, activeRatio: 73.68 },
  { rep: "Jonny Cunningham", spend: 230514.37, profit: 51753.68, margin: 22.45, packs: 142395, activeAccounts: 55, totalAccounts: 111, profitPerActiveShop: 940.98, profitPerPack: 0.36, activeRatio: 49.55 },
  { rep: "Michael McKay", spend: 324630.48, profit: 53194.85, margin: 16.39, packs: 184224, activeAccounts: 105, totalAccounts: 192, profitPerActiveShop: 506.62, profitPerPack: 0.29, activeRatio: 54.69 },
  { rep: "Pete Dhillon", spend: 167740.56, profit: 33757.35, margin: 20.12, packs: 114437, activeAccounts: 76, totalAccounts: 109, profitPerActiveShop: 444.18, profitPerPack: 0.29, activeRatio: 69.72 },
  { rep: "Stuart Geddes", spend: 162698.54, profit: 25799.93, margin: 15.86, packs: 68130, activeAccounts: 57, totalAccounts: 71, profitPerActiveShop: 452.63, profitPerPack: 0.38, activeRatio: 80.28 },
  { rep: "Louise Skiba", spend: 113006.33, profit: 11745.28, margin: 10.39, packs: 88291, activeAccounts: 10, totalAccounts: 13, profitPerActiveShop: 1174.53, profitPerPack: 0.13, activeRatio: 76.92 },
  { rep: "Mike Cooper", spend: 88801.22, profit: 13545.86, margin: 15.25, packs: 91490, activeAccounts: 10, totalAccounts: 20, profitPerActiveShop: 1354.59, profitPerPack: 0.15, activeRatio: 50.00 },
  { rep: "Murray Glasgow", spend: 1259.21, profit: 365.84, margin: 29.05, packs: 289, activeAccounts: 3, totalAccounts: 5, profitPerActiveShop: 121.95, profitPerPack: 1.27, activeRatio: 60.00 }
];

const defaultRepData = [
  { rep: "Clare Quinn", spend: 174152.39, profit: 22951.81, margin: 13.18, packs: 105432, activeAccounts: 42, totalAccounts: 81, profitPerActiveShop: 546.47, profitPerPack: 0.22, activeRatio: 51.85 },
  { rep: "Craig McDowall", spend: 283468.89, profit: 44286.56, margin: 15.62, packs: 190846, activeAccounts: 108, totalAccounts: 262, profitPerActiveShop: 410.06, profitPerPack: 0.23, activeRatio: 41.22 },
  { rep: "Ged Thomas", spend: 152029.32, profit: 34298.11, margin: 22.56, packs: 102684, activeAccounts: 69, totalAccounts: 94, profitPerActiveShop: 497.07, profitPerPack: 0.33, activeRatio: 73.40 },
  { rep: "Jonny Cunningham", spend: 162333.80, profit: 29693.82, margin: 18.29, packs: 91437, activeAccounts: 48, totalAccounts: 91, profitPerActiveShop: 618.62, profitPerPack: 0.32, activeRatio: 52.75 },
  { rep: "Michael McKay", spend: 324630.48, profit: 53194.85, margin: 16.39, packs: 184224, activeAccounts: 105, totalAccounts: 192, profitPerActiveShop: 506.62, profitPerPack: 0.29, activeRatio: 54.69 },
  { rep: "Pete Dhillon", spend: 167740.56, profit: 33757.35, margin: 20.12, packs: 114437, activeAccounts: 76, totalAccounts: 109, profitPerActiveShop: 444.18, profitPerPack: 0.29, activeRatio: 69.72 },
  { rep: "Stuart Geddes", spend: 154070.16, profit: 25005.81, margin: 16.23, packs: 62039, activeAccounts: 56, totalAccounts: 70, profitPerActiveShop: 446.53, profitPerPack: 0.40, activeRatio: 80.00 },
  { rep: "Murray Glasgow", spend: 1259.21, profit: 365.84, margin: 29.05, packs: 289, activeAccounts: 3, totalAccounts: 5, profitPerActiveShop: 121.95, profitPerPack: 1.27, activeRatio: 60.00 }
];

const defaultRevaData = [
  { rep: "Louise Skiba", spend: 113006.33, profit: 11745.28, margin: 10.39, packs: 88291, activeAccounts: 10, totalAccounts: 13, profitPerActiveShop: 1174.53, profitPerPack: 0.13, activeRatio: 76.92 },
  { rep: "Stuart Geddes", spend: 8628.38, profit: 794.12, margin: 9.20, packs: 6091, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 794.12, profitPerPack: 0.13, activeRatio: 100.00 },
  { rep: "Craig McDowall", spend: 123321.25, profit: 11616.22, margin: 9.42, packs: 88633, activeAccounts: 13, totalAccounts: 13, profitPerActiveShop: 893.56, profitPerPack: 0.13, activeRatio: 100.00 },
  { rep: "Ged Thomas", spend: 34097.32, profit: 3539.37, margin: 10.38, packs: 20190, activeAccounts: 2, totalAccounts: 2, profitPerActiveShop: 1769.69, profitPerPack: 0.18, activeRatio: 100.00 },
  { rep: "Jonny Cunningham", spend: 15361.23, profit: 1543.18, margin: 10.05, packs: 12953, activeAccounts: 3, totalAccounts: 4, profitPerActiveShop: 514.39, profitPerPack: 0.12, activeRatio: 75.00 },
  { rep: "Pete Dhillon", spend: 12554.86, profit: 1297.68, margin: 10.34, packs: 10216, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 648.84, profitPerPack: 0.13, activeRatio: 66.67 },
  { rep: "Michael McKay", spend: 9875.24, profit: 1052.31, margin: 10.66, packs: 7843, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 526.16, profitPerPack: 0.13, activeRatio: 66.67 }
];

const defaultWholesaleData = [
  { rep: "Craig McDowall", spend: 200479.40, profit: 20096.46, margin: 10.02, packs: 48250, activeAccounts: 6, totalAccounts: 16, profitPerActiveShop: 3349.41, profitPerPack: 0.42, activeRatio: 37.50 },
  { rep: "Pete Dhillon", spend: 5850.00, profit: 900.00, margin: 15.38, packs: 11000, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 900.00, profitPerPack: 0.08, activeRatio: 100.00 },
  { rep: "Jonny Cunningham", spend: 68180.57, profit: 22059.86, margin: 32.36, packs: 50958, activeAccounts: 7, totalAccounts: 20, profitPerActiveShop: 3151.41, profitPerPack: 0.43, activeRatio: 35.00 },
  { rep: "Mike Cooper", spend: 88801.22, profit: 13545.86, margin: 15.25, packs: 91490, activeAccounts: 10, totalAccounts: 20, profitPerActiveShop: 1354.59, profitPerPack: 0.15, activeRatio: 50.00 }
];

const defaultBaseSummary = {
  totalSpend: 2056199.28,
  totalProfit: 326951.32,
  totalPacks: 1245291,
  totalAccounts: 1067,
  activeAccounts: 555,
  averageMargin: 15.90
};

const defaultRevaValues = {
  totalSpend: 279053.28,
  totalProfit: 27694.99,
  totalPacks: 203205,
  totalAccounts: 29,
  activeAccounts: 26,
  averageMargin: 9.85
};

const defaultWholesaleValues = {
  totalSpend: 363311.19,
  totalProfit: 56602.18,
  totalPacks: 201698,
  totalAccounts: 57,
  activeAccounts: 24,
  averageMargin: 15.58
};

const defaultSummaryChanges = {
  totalSpend: 3.55,
  totalProfit: 18.77,
  totalPacks: -3.86,
  totalAccounts: 7.89,
  activeAccounts: -4.31,
  averageMargin: 2.04
};

const defaultRepChanges = {
  "Clare Quinn": { spend: -13.97, profit: 23.17, margin: 43.17, packs: -10.76, profitPerActiveShop: 14.43, profitPerPack: 38.03, activeRatio: 6.36 },
  "Craig McDowall": { spend: 18.28, profit: 19.44, margin: 0.98, packs: 0.60, profitPerActiveShop: 28.79, profitPerPack: 18.72, activeRatio: -12.72 },
  "Ged Thomas": { spend: -4.21, profit: 4.25, margin: 8.84, packs: -14.71, profitPerActiveShop: 7.24, profitPerPack: 22.14, activeRatio: -3.80 },
  "Jonny Cunningham": { spend: 3.11, profit: 70.82, margin: 65.67, packs: 2.84, profitPerActiveShop: 101.88, profitPerPack: 66.10, activeRatio: -16.15 },
  "Michael McKay": { spend: 15.55, profit: 45.26, margin: 25.71, packs: 8.70, profitPerActiveShop: 59.09, profitPerPack: 33.63, activeRatio: -9.17 },
  "Pete Dhillon": { spend: -13.56, profit: -0.59, margin: 15.00, packs: -27.31, profitPerActiveShop: 2.02, profitPerPack: 36.75, activeRatio: -3.46 },
  "Stuart Geddes": { spend: -11.2, profit: -5.95, margin: 5.90, packs: -37.00, profitPerActiveShop: -7.66, profitPerPack: 49.30, activeRatio: -1.08 },
  "Louise Skiba": { spend: -1.11, profit: 2.94, margin: 4.09, packs: -3.86, profitPerActiveShop: -7.36, profitPerPack: 7.07, activeRatio: -5.97 },
  "Mike Cooper": { spend: 11.78, profit: -20.33, margin: -28.73, packs: 117.82, profitPerActiveShop: -28.25, profitPerPack: -63.41, activeRatio: 11.11 },
  "Murray Glasgow": { spend: 100, profit: 100, margin: 100, packs: 100, profitPerActiveShop: 100, profitPerPack: 100, activeRatio: 100 }
};

const RepPerformance = () => {
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [overallData, setOverallData] = useState(defaultOverallData);
  const [repData, setRepData] = useState(defaultRepData);
  const [revaData, setRevaData] = useState(defaultRevaData);
  const [wholesaleData, setWholesaleData] = useState(defaultWholesaleData);
  const [baseSummary, setBaseSummary] = useState(defaultBaseSummary);
  const [revaValues, setRevaValues] = useState(defaultRevaValues);
  const [wholesaleValues, setWholesaleValues] = useState(defaultWholesaleValues);
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState(defaultRepChanges);
  
  useEffect(() => {
    const storedData = localStorage.getItem('repPerformanceData');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        setOverallData(parsedData.overallData || defaultOverallData);
        setRepData(parsedData.repData || defaultRepData);
        setRevaData(parsedData.revaData || defaultRevaData);
        setWholesaleData(parsedData.wholesaleData || defaultWholesaleData);
        setBaseSummary(parsedData.baseSummary || defaultBaseSummary);
        setRevaValues(parsedData.revaValues || defaultRevaValues);
        setWholesaleValues(parsedData.wholesaleValues || defaultWholesaleValues);
        setSummaryChanges(parsedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(parsedData.repChanges || defaultRepChanges);
      } catch (error) {
        console.error('Error parsing stored data:', error);
      }
    }
  }, []);

  const getActiveData = (tabValue: string) => {
    switch (tabValue) {
      case 'rep':
        return repData;
      case 'reva':
        return includeReva ? revaData : [];
      case 'wholesale':
        return includeWholesale ? wholesaleData : [];
      case 'overall':
      default:
        let combinedData = [...overallData];
        
        if (!includeReva) {
          const revaReps = revaData.map(item => item.rep);
          combinedData = combinedData.filter(rep => 
            !revaReps.includes(rep.rep) || rep.rep === "Stuart Geddes" || rep.rep === "Craig McDowall" || rep.rep === "Ged Thomas"
          );
        }
        
        if (!includeWholesale) {
          const wholesaleReps = wholesaleData.map(item => item.rep);
          combinedData = combinedData.filter(rep => 
            !wholesaleReps.includes(rep.rep) || rep.rep === "Craig McDowall" || rep.rep === "Pete Dhillon" || rep.rep === "Jonny Cunningham"
          );
        }
        
        return combinedData;
    }
  };

  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const summary = calculateSummary(baseSummary, revaValues, wholesaleValues, includeReva, includeWholesale);

  const renderChangeIndicator = (changeValue: number, size = "small") => {
    const isPositive = changeValue > 0;
    
    if (Math.abs(changeValue) < 0.1) return null; // No significant change
    
    if (size === "small") {
      return (
        <span className={`inline-flex items-center ml-1 ${isPositive ? 'text-emerald-500' : 'text-finance-red'}`}>
          {isPositive ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
          }
        </span>
      );
    } else {
      return (
        <span className={`inline-flex items-center ml-1 ${isPositive ? 'text-emerald-500' : 'text-finance-red'}`}>
          {isPositive ? 
            <ArrowUp className="h-3.5 w-3.5 md:h-4 md:w-4" /> : 
            <ArrowDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
          }
          <span className="text-xs font-medium ml-0.5">{Math.abs(changeValue).toFixed(1)}%</span>
        </span>
      );
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
        <PerformanceHeader />
        
        <div className="flex justify-end mb-4">
          <Link to="/data-upload">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Upload className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
          </Link>
        </div>

        <PerformanceFilters
          includeReva={includeReva}
          setIncludeReva={setIncludeReva}
          includeWholesale={includeWholesale}
          setIncludeWholesale={setIncludeWholesale}
        />

        <SummaryMetrics 
          summary={summary}
          summaryChanges={summaryChanges}
        />

        <PerformanceContent
          tabValues={['overall', 'rep', 'reva', 'wholesale']}
          getActiveData={getActiveData}
          sortData={sortData}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
          repChanges={repChanges}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
          formatNumber={formatNumber}
          renderChangeIndicator={renderChangeIndicator}
        />
      </div>
    </div>
  );
};

export default RepPerformance;
