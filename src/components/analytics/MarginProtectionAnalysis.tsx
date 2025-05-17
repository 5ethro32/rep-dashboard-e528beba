
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertTriangle, ArrowDown, ArrowUp, ShieldAlert, Info } from 'lucide-react';

interface MarginProtectionAnalysisProps {
  data: any[];
}

const MarginProtectionAnalysis: React.FC<MarginProtectionAnalysisProps> = ({ data }) => {
  const analysisData = useMemo(() => {
    if (!data || data.length === 0) return { 
      riskProducts: [],
      missingData: {
        ethNet: 0,
        avgCost: 0,
        total: 0
      },
      statsData: {
        total: 0, 
        riskCount: 0, 
        errorCount: 0, 
        highRisk: 0 
      }
    };

    // Filter to only include products with basic data
    const filteredData = data.filter(item => 
      item.currentREVAPrice > 0
    );
    
    const total = filteredData.length;
    let ethNetMissingCount = 0;
    let avgCostMissingCount = 0;
    
    // Identify risk products
    const allRiskProducts = filteredData.map(item => {
      const currentMargin = item.avgCost > 0 ? 
        (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : null;
      const marketDelta = item.ethNetPrice > 0 ?
        ((item.currentREVAPrice - item.ethNetPrice) / item.ethNetPrice * 100).toFixed(1) : null;
      
      let riskFactors = [];
      let riskLevel = 'none';
      
      // Check for missing data
      if (item.ethNetPrice <= 0) {
        ethNetMissingCount++;
        riskFactors.push('Missing ETH NET price');
      }
      
      if (!item.avgCost || item.avgCost <= 0) {
        avgCostMissingCount++;
        riskFactors.push('Missing average cost');
      }
      
      // Check for margin risks
      if (item.avgCost > 0 && currentMargin !== null) {
        // Critical: Price below cost
        if (currentMargin < 0) {
          riskFactors.push('Price below cost');
          riskLevel = 'critical';
        }
        // High: Very low margin
        else if (currentMargin < 5) {
          riskFactors.push('Very low margin (< 5%)');
          riskLevel = 'high';
        }
        // Medium: Low margin
        else if (currentMargin < 10) {
          riskFactors.push('Low margin (< 10%)');
          riskLevel = 'medium';
        }
        
        // Cost approaching market price
        if (item.ethNetPrice > 0 && item.avgCost > item.ethNetPrice * 0.9) {
          riskFactors.push('Cost close to market price');
          riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
        }
      }
      
      // Market pricing concerns
      if (item.ethNetPrice > 0) {
        // Price significantly below market
        if (item.currentREVAPrice < item.ethNetPrice * 0.9) {
          riskFactors.push('Price significantly below market');
          riskLevel = riskLevel === 'none' ? 'medium' : riskLevel;
        }
        
        // Price significantly above market
        if (item.currentREVAPrice > item.ethNetPrice * 1.2) {
          riskFactors.push('Price significantly above market');
          riskLevel = riskLevel === 'none' ? 'low' : riskLevel;
        }
      }
      
      return {
        id: item.id,
        name: item.description?.substring(0, 30) || 'Unknown',
        price: item.currentREVAPrice,
        cost: item.avgCost || 0,
        margin: currentMargin !== null ? currentMargin.toFixed(1) + '%' : 'N/A',
        ethNetPrice: item.ethNetPrice > 0 ? item.ethNetPrice : 'N/A',
        marketDelta,
        revaUsage: item.revaUsage || 0,
        riskFactors,
        riskLevel,
        hasMarketPrice: item.ethNetPrice > 0,
        hasCost: item.avgCost > 0
      };
    });
    
    // Filter to only include products with risks
    const riskProducts = allRiskProducts
      .filter(item => item.riskFactors.length > 0)
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (riskOrder[a.riskLevel as keyof typeof riskOrder] || 4) - 
               (riskOrder[b.riskLevel as keyof typeof riskOrder] || 4);
      });
    
    // Calculate risk stats
    const riskCount = riskProducts.length;
    const errorCount = riskProducts.filter(item => 
      item.riskFactors.includes('Missing ETH NET price') || 
      item.riskFactors.includes('Missing average cost')).length;
    const highRisk = riskProducts.filter(item => 
      item.riskLevel === 'critical' || item.riskLevel === 'high').length;
    
    return {
      riskProducts,
      missingData: {
        ethNet: ethNetMissingCount,
        avgCost: avgCostMissingCount,
        total
      },
      statsData: {
        total,
        riskCount,
        errorCount,
        highRisk
      }
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Margin Protection Analysis</h3>
        <p className="text-muted-foreground">Insufficient data for risk analysis</p>
      </div>
    );
  }

  const getRiskIcon = (riskLevel: string) => {
    switch(riskLevel) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <ShieldAlert className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <ArrowDown className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Margin Protection Analysis</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Identifies products at risk of margin erosion and data quality issues
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-red-500/10 p-3 mr-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Risk Products</p>
              <p className="text-2xl font-semibold">{analysisData.statsData.highRisk}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-orange-500/10 p-3 mr-3">
              <ArrowDown className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Risk Products</p>
              <p className="text-2xl font-semibold">{analysisData.statsData.riskCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-blue-500/10 p-3 mr-3">
              <Info className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missing ETH NET</p>
              <p className="text-2xl font-semibold">{analysisData.missingData.ethNet}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-purple-500/10 p-3 mr-3">
              <ShieldAlert className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missing Avg Cost</p>
              <p className="text-2xl font-semibold">{analysisData.missingData.avgCost}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Products Table */}
      <div>
        <h4 className="text-lg font-medium mb-3">Margin Risk Products</h4>
        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="w-[80px]">Usage</TableHead>
                <TableHead className="w-[80px]">Margin</TableHead>
                <TableHead className="w-[80px]">Price</TableHead>
                <TableHead className="w-[80px]">ETH NET</TableHead>
                <TableHead>Risk Factors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisData.riskProducts.slice(0, 15).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{getRiskIcon(item.riskLevel)}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.revaUsage}</TableCell>
                  <TableCell>{item.margin}</TableCell>
                  <TableCell>£{item.price.toFixed(2)}</TableCell>
                  <TableCell>{item.ethNetPrice !== 'N/A' ? `£${parseFloat(item.ethNetPrice).toFixed(2)}` : 'N/A'}</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {item.riskFactors.map((factor, i) => (
                        <li key={i} className="text-muted-foreground">{factor}</li>
                      ))}
                    </ul>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="text-xs text-muted-foreground mt-3 px-4">
          <p>Products identified as having margin risks, missing data, or potential pricing issues.</p>
        </div>
      </div>
    </div>
  );
};

export default MarginProtectionAnalysis;
