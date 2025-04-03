
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const RepPerformance = () => {
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');

  // Hard-coded data for March 2025 with correct values from Excel
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

  // Summaries based on toggle states - updated with accurate Excel data
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
  
  // Performance changes from Feb to March - updated with accurate Excel data
  const summaryChanges = {
    totalSpend: 3.55,
    totalProfit: 18.77,
    totalPacks: -3.86,
    totalAccounts: 7.89,
    activeAccounts: -4.31,
    averageMargin: 2.04
  };
  
  // Rep-level performance changes - updated with accurate Excel data
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

  // Calculate current summary based on toggle states
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
    
    // Recalculate average margin
    summary.averageMargin = summary.totalSpend > 0 ? (summary.totalProfit / summary.totalSpend) * 100 : 0;
    
    return summary;
  };
  
  // Get active data based on current tab
  const getActiveData = (tabValue) => {
    switch (tabValue) {
      case 'rep':
        return repData;
      case 'reva':
        return includeReva ? revaData : [];
      case 'wholesale':
        return includeWholesale ? wholesaleData : [];
      case 'overall':
      default:
        // For overall, combine data from different sources based on toggles
        let combinedData = [...overallData];
        
        // If toggles are off, filter out reps from respective categories
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

  // Sort the active data
  const sortData = (data) => {
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

  // Get current summary
  const summary = calculateSummary();

  // Format helpers
  const formatCurrency = (value, decimals = 0) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-GB').format(value);
  };
  
  // Helper to render change indicators
  const renderChangeIndicator = (changeValue, size = "small") => {
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

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-finance-darkBg text-white">
      <header className="py-16 px-6 md:px-12 container max-w-7xl mx-auto animate-fade-in bg-gray-950">
        <div className="flex justify-between items-center mb-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              <Home className="h-5 w-5 mr-2" />
              Back to Finance Report
            </Button>
          </Link>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold">
          Rep
          <br />
          Perform<span className="font-normal italic">a</span>nce
          <br />
          <span className="text-finance-red">Dashboard</span>
        </h1>
        <div className="mt-8 text-right">
          <span className="text-xl md:text-2xl">March 2025</span>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-6 md:px-12 pb-16 bg-gray-950">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8 animate-slide-in-up">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="bg-gray-900/60 p-3 rounded-lg flex items-center">
              <Label htmlFor="include-reva" className="text-sm mr-2">Include REVA</Label>
              <Switch 
                id="include-reva" 
                checked={includeReva} 
                onCheckedChange={setIncludeReva}
                className="data-[state=checked]:bg-finance-red"
              />
            </div>
            <div className="bg-gray-900/60 p-3 rounded-lg flex items-center">
              <Label htmlFor="include-wholesale" className="text-sm mr-2">Include Wholesale</Label>
              <Switch 
                id="include-wholesale" 
                checked={includeWholesale}
                onCheckedChange={setIncludeWholesale}
                className="data-[state=checked]:bg-finance-red"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-in-up">
          <div className="bg-transparent rounded-lg border border-white/10 p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Revenue</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalSpend)}</p>
              {renderChangeIndicator(summaryChanges.totalSpend, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatCurrency(Math.round(summary.totalSpend / (1 + summaryChanges.totalSpend / 100)))}
            </div>
          </div>
          <div className="bg-transparent rounded-lg border border-white/10 p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Profit</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold mt-1 text-finance-red">{formatCurrency(summary.totalProfit)}</p>
              {renderChangeIndicator(summaryChanges.totalProfit, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatCurrency(Math.round(summary.totalProfit / (1 + summaryChanges.totalProfit / 100)))}
            </div>
          </div>
          <div className="bg-transparent rounded-lg border border-white/10 p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Margin</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold mt-1">{formatPercent(summary.averageMargin)}</p>
              {renderChangeIndicator(summaryChanges.averageMargin, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatPercent(summary.averageMargin - summaryChanges.averageMargin)}
            </div>
          </div>
          <div className="bg-transparent rounded-lg border border-white/10 p-5">
            <h3 className="text-xs font-medium text-finance-gray uppercase">Packs</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold mt-1">{formatNumber(summary.totalPacks)}</p>
              {renderChangeIndicator(summaryChanges.totalPacks, "large")}
            </div>
            <div className="text-xs text-finance-gray mt-1">
              prev: {formatNumber(Math.round(summary.totalPacks / (1 + summaryChanges.totalPacks / 100)))}
            </div>
          </div>
        </div>

        <div className="mb-8 animate-slide-in-up">
          <Tabs defaultValue="overall" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8 bg-gray-900/50">
              <TabsTrigger value="overall" className="data-[state=active]:bg-finance-red data-[state=active]:text-white">
                Overall Performance
              </TabsTrigger>
              <TabsTrigger value="rep" className="data-[state=active]:bg-finance-red data-[state=active]:text-white">
                Retail Performance
              </TabsTrigger>
              <TabsTrigger value="reva" className="data-[state=active]:bg-finance-red data-[state=active]:text-white">
                REVA Performance
              </TabsTrigger>
              <TabsTrigger value="wholesale" className="data-[state=active]:bg-finance-red data-[state=active]:text-white">
                Wholesale Performance
              </TabsTrigger>
            </TabsList>
            
            {['overall', 'rep', 'reva', 'wholesale'].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-0">
                <div className="bg-gray-900/40 rounded-lg border border-white/10 mb-8">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      {tabValue === 'overall'
                        ? 'Overall Rep Performance'
                        : tabValue === 'rep' 
                          ? 'Retail Performance' 
                          : tabValue === 'reva' 
                            ? 'REVA Performance' 
                            : 'Wholesale Performance'}
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead>
                          <tr>
                            <th 
                              onClick={() => handleSort('rep')}
                              className="px-6 py-3 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Rep {sortBy === 'rep' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('spend')}
                              className="px-6 py-3 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Spend {sortBy === 'spend' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('profit')}
                              className="px-6 py-3 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('margin')}
                              className="px-6 py-3 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
                            >
                              Margin {sortBy === 'margin' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              onClick={() => handleSort('packs')}
                              className="px-6 py-3 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5"
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
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {item.rep}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      {formatCurrency(item.spend)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].spend)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-finance-red">
                                    <div className="flex items-center">
                                      {formatCurrency(item.profit)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].profit)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      {formatPercent(item.margin)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].margin)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      {formatNumber(item.packs)}
                                      {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].packs)}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-finance-gray">
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
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <RepProfitChart 
                    displayData={sortData(getActiveData(tabValue))}
                    repChanges={repChanges}
                    formatCurrency={formatCurrency}
                  />
                  
                  <RepProfitShare 
                    displayData={sortData(getActiveData(tabValue))}
                    repChanges={repChanges}
                  />
                  
                  <RepMarginChart 
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

      <footer className="py-6 border-t border-white/10">
        <div className="container max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center">
            <div className="text-sm text-finance-gray">Rep Performance Dashboard</div>
            <div className="text-sm text-finance-gray">March 2025</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Profit Distribution Chart Component
const RepProfitChart = ({ displayData, repChanges, formatCurrency }) => {
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-medium mb-4">Profit Distribution</h3>
      <div className="h-72 flex items-end justify-center">
        <div className="w-full h-full flex items-end justify-center">
          <div className="flex items-end space-x-2">
            {displayData.map(item => {
              const repInitials = item.rep.split(' ').map(name => name[0]).join('');
              const barHeight = Math.max(20, (item.profit / 75999) * 200);
              const change = repChanges[item.rep] ? repChanges[item.rep].profit : 0;
              const barColor = change > 0 ? 'from-finance-red to-red-700' : 'from-finance-red to-red-600 opacity-90';
              
              return (
                <div 
                  key={item.rep} 
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    {Math.abs(change) >= 0.1 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        {change > 0 ? 
                          <ChevronUp className="h-5 w-5 text-green-500" /> : 
                          <ChevronDown className="h-5 w-5 text-finance-red" />
                        }
                      </div>
                    )}
                    <div 
                      className={`w-10 bg-gradient-to-t ${barColor} rounded-t-lg shadow-lg`}
                      style={{ 
                        height: `${barHeight}px` 
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs font-bold">{repInitials}</div>
                  <div className="text-xs text-finance-gray">{formatCurrency(item.profit, 0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Pie Chart for Profit Share
const RepProfitShare = ({ displayData, repChanges }) => {
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-medium mb-4">Profit Share</h3>
      <div className="h-72 flex items-center justify-center">
        <svg viewBox="0 0 400 400" width="100%" height="100%">
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <defs>
            {/* Gradient definitions */}
            <radialGradient id="redGradient1" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
            <radialGradient id="redGradient2" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
            <radialGradient id="redGradient3" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="10%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
            <radialGradient id="redGradient4" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="10%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
            <radialGradient id="redGradient5" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="10%" stopColor="#fca5a5" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
            <radialGradient id="redGradient6" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="10%" stopColor="#fca5a5" />
              <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
            <radialGradient id="redGradient7" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="10%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
            <radialGradient id="redGradient8" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="10%" stopColor="#fca5a5" />
              <stop offset="100%" stopColor="#ef4444" />
            </radialGradient>
            <radialGradient id="redGradient9" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="10%" stopColor="#fee2e2" />
              <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
          </defs>
          
          <g transform="translate(200, 200)">
            {(() => {
              // Calculate total profit for percentage
              const totalProfit = displayData.reduce((sum, item) => sum + item.profit, 0);
              
              // Set colors for slices with gradients
              const gradients = [
                'url(#redGradient1)', 'url(#redGradient2)', 'url(#redGradient3)', 
                'url(#redGradient4)', 'url(#redGradient5)', 'url(#redGradient6)',
                'url(#redGradient7)', 'url(#redGradient8)', 'url(#redGradient9)'
              ];
              
              // Sort data by profit for better visualization
              const sortedData = [...displayData].sort((a, b) => b.profit - a.profit);
              
              // Generate pie slices
              let startAngle = 0;
              return sortedData.map((item, index) => {
                // Skip items with very small or zero profit
                if (item.profit < 100) return null;
                
                const percentage = (item.profit / totalProfit) * 100;
                const angle = (percentage / 100) * 360;
                const endAngle = startAngle + angle;
                
                // Create SVG arc path - using a small inner radius for a donut effect
                const innerRadius = 40; // Add a hole in the center
                
                // Outer arc
                const x1 = 160 * Math.cos((startAngle - 90) * (Math.PI / 180));
                const y1 = 160 * Math.sin((startAngle - 90) * (Math.PI / 180));
                const x2 = 160 * Math.cos((endAngle - 90) * (Math.PI / 180));
                const y2 = 160 * Math.sin((endAngle - 90) * (Math.PI / 180));
                
                // Inner arc (for donut hole)
                const x3 = innerRadius * Math.cos((endAngle - 90) * (Math.PI / 180));
                const y3 = innerRadius * Math.sin((endAngle - 90) * (Math.PI / 180));
                const x4 = innerRadius * Math.cos((startAngle - 90) * (Math.PI / 180));
                const y4 = innerRadius * Math.sin((startAngle - 90) * (Math.PI / 180));
                
                // Create SVG arc properties
                const largeArc = angle > 180 ? 1 : 0;
                // Path for donut slice
                const pathD = `M ${x1} ${y1} A 160 160 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
                
                // Create explode effect - move slice slightly outward
                const explodeAngle = startAngle + (angle / 2) - 90;
                const explodeDistance = 8; // Slightly reduced distance to explode
                const translateX = explodeDistance * Math.cos(explodeAngle * (Math.PI / 180));
                const translateY = explodeDistance * Math.sin(explodeAngle * (Math.PI / 180));
                
                // Create label position (middle of arc)
                const labelAngle = startAngle + (angle / 2) - 90;
                const labelRadius = 90; // Position labels inside the pie
                const labelX = labelRadius * Math.cos(labelAngle * (Math.PI / 180));
                const labelY = labelRadius * Math.sin(labelAngle * (Math.PI / 180));
                
                // Get change value for this rep
                const change = repChanges[item.rep] ? repChanges[item.rep].profit : 0;
                
                // Create slice with transform for explosion effect
                const slice = (
                  <g key={item.rep} transform={`translate(${translateX}, ${translateY})`}>
                    <path
                      d={pathD}
                      fill={gradients[index % gradients.length]}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                      filter="url(#dropShadow)"
                      className="hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <title>{item.rep}: £{Math.round(item.profit).toLocaleString()} ({percentage.toFixed(1)}%)</title>
                    </path>
                    {angle > 20 && ( // Only show label if slice is big enough
                      <g>
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          fill="white"
                          fontSize="14"
                          fontWeight="bold"
                          className="select-none"
                        >
                          {item.rep.split(' ').map(name => name[0]).join('')}
                        </text>
                        {Math.abs(change) >= 0.1 && (
                          <text
                            x={labelX}
                            y={labelY - 18}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill={change > 0 ? "#10b981" : "#f43f5e"}
                            fontSize="12"
                            fontWeight="bold"
                            className="select-none"
                          >
                            {change > 0 ? "↑" : "↓"} 
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
                
                // Update start angle for next slice
                startAngle = endAngle;
                
                return slice;
              }).filter(Boolean); // Remove null entries
            })()}
          </g>
        </svg>
      </div>
    </div>
  );
};

// Margin Comparison Chart
const RepMarginChart = ({ displayData, repChanges, formatPercent }) => {
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-medium mb-4">Margin Comparison</h3>
      <div className="h-72 flex items-end justify-center">
        <div className="w-full h-full flex items-end justify-center">
          <div className="flex items-end space-x-2">
            {displayData.map(item => {
              const repInitials = item.rep.split(' ').map(name => name[0]).join('');
              const barHeight = Math.max(20, (item.margin / 32) * 200);
              const change = repChanges[item.rep] ? repChanges[item.rep].margin : 0;
              const barColor = change > 0 ? 'from-blue-500 to-blue-700' : 'from-blue-400 to-blue-600';
              
              return (
                <div 
                  key={item.rep} 
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    {Math.abs(change) >= 0.1 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        {change > 0 ? 
                          <ChevronUp className="h-5 w-5 text-green-500" /> : 
                          <ChevronDown className="h-5 w-5 text-finance-red" />
                        }
                      </div>
                    )}
                    <div 
                      className={`w-10 bg-gradient-to-t ${barColor} rounded-t-lg shadow-lg`}
                      style={{ 
                        height: `${barHeight}px` 
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs font-bold">{repInitials}</div>
                  <div className="text-xs text-finance-gray">{formatPercent(item.margin)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepPerformance;
