import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import RepProfitChart from '@/components/RepProfitChart';
import RepProfitShare from '@/components/RepProfitShare';
import RepMarginComparison from '@/components/RepMarginComparison';
import { useIsMobile } from '@/hooks/use-mobile';

const RepPerformance = () => {
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const isMobile = useIsMobile();

  const overallData = [
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

  const repData = [
    { rep: "Clare Quinn", spend: 174152.39, profit: 22951.81, margin: 13.18, packs: 105432, activeAccounts: 42, totalAccounts: 81, profitPerActiveShop: 546.47, profitPerPack: 0.22, activeRatio: 51.85 },
    { rep: "Craig McDowall", spend: 283468.89, profit: 44286.56, margin: 15.62, packs: 190846, activeAccounts: 108, totalAccounts: 262, profitPerActiveShop: 410.06, profitPerPack: 0.23, activeRatio: 41.22 },
    { rep: "Ged Thomas", spend: 152029.32, profit: 34298.11, margin: 22.56, packs: 102684, activeAccounts: 69, totalAccounts: 94, profitPerActiveShop: 497.07, profitPerPack: 0.33, activeRatio: 73.40 },
    { rep: "Jonny Cunningham", spend: 162333.80, profit: 29693.82, margin: 18.29, packs: 91437, activeAccounts: 48, totalAccounts: 91, profitPerActiveShop: 618.62, profitPerPack: 0.32, activeRatio: 52.75 },
    { rep: "Michael McKay", spend: 324630.48, profit: 53194.85, margin: 16.39, packs: 184224, activeAccounts: 105, totalAccounts: 192, profitPerActiveShop: 506.62, profitPerPack: 0.29, activeRatio: 54.69 },
    { rep: "Pete Dhillon", spend: 167740.56, profit: 33757.35, margin: 20.12, packs: 114437, activeAccounts: 76, totalAccounts: 109, profitPerActiveShop: 444.18, profitPerPack: 0.29, activeRatio: 69.72 },
    { rep: "Stuart Geddes", spend: 154070.16, profit: 25005.81, margin: 16.23, packs: 62039, activeAccounts: 56, totalAccounts: 70, profitPerActiveShop: 446.53, profitPerPack: 0.40, activeRatio: 80.00 },
    { rep: "Murray Glasgow", spend: 1259.21, profit: 365.84, margin: 29.05, packs: 289, activeAccounts: 3, totalAccounts: 5, profitPerActiveShop: 121.95, profitPerPack: 1.27, activeRatio: 60.00 }
  ];

  const revaData = [
    { rep: "Louise Skiba", spend: 113006.33, profit: 11745.28, margin: 10.39, packs: 88291, activeAccounts: 10, totalAccounts: 13, profitPerActiveShop: 1174.53, profitPerPack: 0.13, activeRatio: 76.92 },
    { rep: "Stuart Geddes", spend: 8628.38, profit: 794.12, margin: 9.20, packs: 6091, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 794.12, profitPerPack: 0.13, activeRatio: 100.00 },
    { rep: "Craig McDowall", spend: 123321.25, profit: 11616.22, margin: 9.42, packs: 88633, activeAccounts: 13, totalAccounts: 13, profitPerActiveShop: 893.56, profitPerPack: 0.13, activeRatio: 100.00 },
    { rep: "Ged Thomas", spend: 34097.32, profit: 3539.37, margin: 10.38, packs: 20190, activeAccounts: 2, totalAccounts: 2, profitPerActiveShop: 1769.69, profitPerPack: 0.18, activeRatio: 100.00 },
    { rep: "Jonny Cunningham", spend: 15361.23, profit: 1543.18, margin: 10.05, packs: 12953, activeAccounts: 3, totalAccounts: 4, profitPerActiveShop: 514.39, profitPerPack: 0.12, activeRatio: 75.00 },
    { rep: "Pete Dhillon", spend: 12554.86, profit: 1297.68, margin: 10.34, packs: 10216, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 648.84, profitPerPack: 0.13, activeRatio: 66.67 },
    { rep: "Michael McKay", spend: 9875.24, profit: 1052.31, margin: 10.66, packs: 7843, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 526.16, profitPerPack: 0.13, activeRatio: 66.67 }
  ];

  const wholesaleData = [
    { rep: "Craig McDowall", spend: 200479.40, profit: 20096.46, margin: 10.02, packs: 48250, activeAccounts: 6, totalAccounts: 16, profitPerActiveShop: 3349.41, profitPerPack: 0.42, activeRatio: 37.50 },
    { rep: "Pete Dhillon", spend: 5850.00, profit: 900.00, margin: 15.38, packs: 11000, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 900.00, profitPerPack: 0.08, activeRatio: 100.00 },
    { rep: "Jonny Cunningham", spend: 68180.57, profit: 22059.86, margin: 32.36, packs: 50958, activeAccounts: 7, totalAccounts: 20, profitPerActiveShop: 3151.41, profitPerPack: 0.43, activeRatio: 35.00 },
    { rep: "Mike Cooper", spend: 88801.22, profit: 13545.86, margin: 15.25, packs: 91490, activeAccounts: 10, totalAccounts: 20, profitPerActiveShop: 1354.59, profitPerPack: 0.15, activeRatio: 50.00 }
  ];

  const baseSummary = {
    totalSpend: 2056199.28,
    totalProfit: 326951.32,
    totalPacks: 1245291,
    totalAccounts: 1067,
    activeAccounts: 555,
    averageMargin: 15.90
  };

  const revaValues = {
    totalSpend: 279053.28,
    totalProfit: 27694.99,
    totalPacks: 203205,
    totalAccounts: 29,
    activeAccounts: 26,
    averageMargin: 9.85
  };

  const wholesaleValues = {
    totalSpend: 363311.19,
    totalProfit: 56602.18,
    totalPacks: 201698,
    totalAccounts: 57,
    activeAccounts: 24,
    averageMargin: 15.58
  };

  const summaryChanges = {
    totalSpend: 3.55,
    totalProfit: 18.77,
    totalPacks: -3.86,
    totalAccounts: 7.89,
    activeAccounts: -4.31,
    averageMargin: 2.04
  };

  const repChanges = {
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

  const calculateSummary = () => {
    let summary = {...baseSummary};
    
    if (!includeReva) {
      summary.totalSpend -= revaValues.totalSpend;
      summary.totalProfit -= revaValues.totalProfit;
      summary.totalPacks -= revaValues.totalPacks;
      summary.totalAccounts -= revaValues.totalAccounts;
      summary.activeAccounts -= revaValues.activeAccounts;
    }
    
    if (!includeWholesale) {
      summary.totalSpend -= wholesaleValues.totalSpend;
      summary.totalProfit -= wholesaleValues.totalProfit;
      summary.totalPacks -= wholesaleValues.totalPacks;
      summary.totalAccounts -= wholesaleValues.totalAccounts;
      summary.activeAccounts -= wholesaleValues.activeAccounts;
    }
    
    summary.averageMargin = summary.totalSpend > 0 ? (summary.totalProfit / summary.totalSpend) * 100 : 0;
    
    return summary;
  };

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

  const summary = calculateSummary();

  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-GB').format(value);
  };

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
            <TrendingUp className="h-5 w-5" /> : 
            <TrendingDown className="h-5 w-5" />
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
    <div className="min-h-screen bg-finance-darkBg text-white">
      <header className="py-8 md:py-16 px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-gray-950">
        <div className="flex justify-between items-center mb-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              <Home className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              <span className="text-sm md:text-base">Back</span>
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold">
          Rep
          <br />
          Perform<span className="font-normal italic">a</span>nce
          <br />
          <span className="text-finance-red">Dashboard</span>
        </h1>
        <div className="mt-4 md:mt-8 text-right">
          <span className="text-lg md:text-xl lg:text-2xl">March 2025</span>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-16 bg-gray-950 overflow-x-hidden">
        <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 justify-between gap-4 mb-8 animate-slide-in-up">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-gray-900/60 p-2 md:p-3 rounded-lg flex items-center">
              <Label htmlFor="include-reva" className="text-xs md:text-sm mr-2">Include REVA</Label>
              <Switch 
                id="include-reva" 
                checked={includeReva} 
                onCheckedChange={setIncludeReva}
                className="data-[state=checked]:bg-finance-red"
              />
            </div>
            <div className="bg-gray-900/60 p-2 md:p-3 rounded-lg flex items-center">
              <Label htmlFor="include-wholesale" className="text-xs md:text-sm mr-2">Include Wholesale</Label>
              <Switch 
                id="include-wholesale" 
                checked={includeWholesale}
                onCheckedChange={setIncludeWholesale}
                className="data-[state=checked]:bg-finance-red"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
          <div className="bg-transparent rounded-lg border border-white/10 p-3 md:p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Revenue</h3>
            <div className="flex items-center">
              <p className="text-xl md:text-2xl font-bold mt-1">{formatCurrency(summary.totalSpend)}</p>
              {renderChangeIndicator(summaryChanges.totalSpend, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatCurrency(Math.round(summary.totalSpend / (1 + summaryChanges.totalSpend / 100)))}
            </div>
          </div>
          <div className="bg-transparent rounded-lg border border-white/10 p-3 md:p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Profit</h3>
            <div className="flex items-center">
              <p className="text-xl md:text-2xl font-bold mt-1 text-finance-red">{formatCurrency(summary.totalProfit)}</p>
              {renderChangeIndicator(summaryChanges.totalProfit, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatCurrency(Math.round(summary.totalProfit / (1 + summaryChanges.totalProfit / 100)))}
            </div>
          </div>
          <div className="bg-transparent rounded-lg border border-white/10 p-3 md:p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Margin</h3>
            <div className="flex items-center">
              <p className="text-xl md:text-2xl font-bold mt-1">{formatPercent(summary.averageMargin)}</p>
              {renderChangeIndicator(summaryChanges.averageMargin, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatPercent(summary.averageMargin - summaryChanges.averageMargin)}
            </div>
          </div>
          <div className="bg-transparent rounded-lg border border-white/10 p-3 md:p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Packs</h3>
            <div className="flex items-center">
              <p className="text-xl md:text-2xl font-bold mt-1">{formatNumber(summary.totalPacks)}</p>
              {renderChangeIndicator(summaryChanges.totalPacks, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatNumber(Math.round(summary.totalPacks / (1 + summaryChanges.totalPacks / 100)))}
            </div>
          </div>
        </div>

        <div className="mb-8 animate-slide-in-up">
          <Tabs defaultValue="overall" className="w-full">
            <TabsList className={`${isMobile ? 'flex flex-wrap' : 'grid grid-cols-4'} mb-6 md:mb-8 bg-gray-900/50`}>
              <TabsTrigger value="overall" className="data-[state=active]:bg-finance-red data-[state=active]:text-white text-xs md:text-sm py-1 md:py-2">
                Overall
              </TabsTrigger>
              <TabsTrigger value="rep" className="data-[state=active]:bg-finance-red data-[state=active]:text-white text-xs md:text-sm py-1 md:py-2">
                Retail
              </TabsTrigger>
              <TabsTrigger value="reva" className="data-[state=active]:bg-finance-red data-[state=active]:text-white text-xs md:text-sm py-1 md:py-2">
                REVA
              </TabsTrigger>
              <TabsTrigger value="wholesale" className="data-[state=active]:bg-finance-red data-[state=active]:text-white text-xs md:text-sm py-1 md:py-2">
                Wholesale
              </TabsTrigger>
            </TabsList>
            
            {['overall', 'rep', 'reva', 'wholesale'].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-0">
                <div className="bg-gray-900/40 rounded-lg border border-white/10 mb-6 md:mb-8">
                  <div className="p-3 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                      {tabValue === 'overall'
                        ? 'Overall Rep Performance'
                        : tabValue === 'rep' 
                          ? 'Retail Performance' 
                          : tabValue === 'reva' 
                            ? 'REVA Performance' 
                            : 'Wholesale Performance'}
                    </h2>
                    <div className="overflow-x-auto -mx-3 md:mx-0">
                      <table className="min-w-full divide-y divide-white/10 text-xs md:text-sm">
                        <thead>
                          <tr>
                            <th 
                              onClick={() => handleSort('rep')}
                              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Rep {sortBy === 'rep' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('spend')}
                              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Spend {sortBy === 'spend' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('profit')}
                              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('margin')}
                              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Margin {sortBy === 'margin' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('packs')}
                              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Packs {sortBy === 'packs' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {(() => {
                            const displayData = sortData(getActiveData(tabValue));
                            return displayData.length > 0 ? (
                              displayData.map((item) => (
                                <tr key={item.rep} className="hover:bg-white/5">
                                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                                    {item.rep}
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                                    <div className="flex items-center">
                                      {formatCurrency(item.spend)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].spend)}
                                    </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-finance-red">
                                    <div className="flex items-center">
                                      {formatCurrency(item.profit)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].profit)}
                                    </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                                    <div className="flex items-center">
                                      {formatPercent(item.margin)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].margin)}
                                    </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                                    <div className="flex items-center">
                                      {formatNumber(item.packs)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].packs)}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-3 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm text-finance-gray">
                                  No data available for the selected filters
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                  <RepProfitChart 
                    displayData={sortData(getActiveData(tabValue))}
                    repChanges={repChanges}
                    formatCurrency={formatCurrency}
                  />
                  
                  <RepProfitShare 
                    displayData={sortData(getActiveData(tabValue))}
                    repChanges={repChanges}
                  />
                  
                  <RepMarginComparison
                    displayData={sortData(getActiveData(tabValue))}
                    repChanges={repChanges}
                    formatPercent={formatPercent}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RepPerformance;
