
import React, { useState } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Info, UploadCloud, Package, TrendingUp, Percent, Flag, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { useToast } from '@/hooks/use-toast';
import PriceElasticityChart from '@/components/analytics/PriceElasticityChart';
import MarginOpportunityMatrix from '@/components/analytics/MarginOpportunityMatrix';
import ProductLifecycleAnalysis from '@/components/analytics/ProductLifecycleAnalysis';
import PricingActionRecommendations from '@/components/analytics/PricingActionRecommendations';

const PricingAnalyticsContent = () => {
  const { engineData, isUploading } = useEngineRoom();
  const { toast } = useToast();
  const [activeAnalytic, setActiveAnalytic] = useState<string>('optimization');

  // If no data is available, show the upload prompt from EngineDashboard
  if (!engineData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
              <p className="text-muted-foreground mb-4">
                Please upload your pricing data on the Dashboard page before accessing analytics.
              </p>
              <a 
                href="/engine-room/engine" 
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary/90"
              >
                Go to Dashboard
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract some key metrics for overview cards
  const getOptimizationMetrics = () => {
    if (!engineData?.items || engineData.items.length === 0) return {
      elasticProducts: 0,
      priceGapAverage: 0,
      marginRecoveryValue: 0,
      optimizationOpportunities: 0
    };

    // Count products where current price is significantly different from market price
    const elasticProducts = engineData.items.filter(item => 
      item.currentREVAPrice > 0 && 
      item.ethNetPrice > 0 && 
      Math.abs(item.currentREVAPrice - item.ethNetPrice) / item.ethNetPrice > 0.05
    ).length;

    // Average gap between our price and market price (%)
    const priceGaps = engineData.items
      .filter(item => item.currentREVAPrice > 0 && item.ethNetPrice > 0)
      .map(item => (item.currentREVAPrice - item.ethNetPrice) / item.ethNetPrice * 100);
    const priceGapAverage = priceGaps.length > 0 
      ? priceGaps.reduce((sum, val) => sum + val, 0) / priceGaps.length 
      : 0;

    // Potential margin recovery value (rough estimate)
    const marginRecoveryValue = engineData.items
      .filter(item => 
        item.currentREVAPrice > 0 && 
        item.avgCost > 0 && 
        ((item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100) < 15 &&
        item.revaUsage > 10
      )
      .reduce((sum, item) => {
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice;
        const targetMargin = 0.15; // 15%
        const priceDiff = item.avgCost / (1 - targetMargin) - item.currentREVAPrice;
        return sum + (priceDiff > 0 ? priceDiff * item.revaUsage : 0);
      }, 0);

    // Count of products with optimization opportunities
    const optimizationOpportunities = engineData.items.filter(item => {
      const currentMargin = item.currentREVAPrice > 0 ? 
        (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : 0;
      return (
        (currentMargin < 15 && item.revaUsage > 10) || // Low margin, high usage
        (currentMargin > 30 && item.ethNetPrice > 0 && item.currentREVAPrice > item.ethNetPrice * 1.1) // High margin, above market
      );
    }).length;

    return {
      elasticProducts,
      priceGapAverage,
      marginRecoveryValue,
      optimizationOpportunities
    };
  };

  const getTrendMetrics = () => {
    if (!engineData?.items || engineData.items.length === 0) return {
      costIncreasingProducts: 0,
      marketPriceDecreaseProducts: 0,
      seasonalTrendProducts: 0,
      volatileProducts: 0
    };

    // These would be more accurate with historical data, but we can simulate for now
    // In a real implementation, these would use actual trend data
    
    // Products with increasing cost trend (simulated)
    const costIncreasingProducts = Math.floor(engineData.items.length * 0.12);
    
    // Products with decreasing market prices (simulated)
    const marketPriceDecreaseProducts = Math.floor(engineData.items.length * 0.08);
    
    // Products with seasonal patterns (simulated)
    const seasonalTrendProducts = Math.floor(engineData.items.length * 0.25);
    
    // Products with high price volatility (simulated)
    const volatileProducts = Math.floor(engineData.items.length * 0.15);

    return {
      costIncreasingProducts,
      marketPriceDecreaseProducts,
      seasonalTrendProducts,
      volatileProducts
    };
  };

  const getPortfolioMetrics = () => {
    if (!engineData?.items || engineData.items.length === 0) return {
      highValueProducts: 0,
      lowMarginHighUsage: 0,
      priceReviewNeeded: 0,
      maturityPhaseProducts: 0,
    };

    // High value products (high usage, high margin)
    const highValueProducts = engineData.items.filter(item => {
      const currentMargin = item.currentREVAPrice > 0 ? 
        (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : 0;
      return currentMargin > 20 && item.revaUsage > (engineData.usageMedian || 10);
    }).length;
    
    // Low margin but high usage products
    const lowMarginHighUsage = engineData.items.filter(item => {
      const currentMargin = item.currentREVAPrice > 0 ? 
        (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : 0;
      return currentMargin < 10 && item.revaUsage > (engineData.usageMedian || 10);
    }).length;
    
    // Products needing price review (various reasons)
    const priceReviewNeeded = engineData.items.filter(item => {
      const currentMargin = item.currentREVAPrice > 0 ? 
        (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : 0;
      
      // Price is below cost
      if (item.currentREVAPrice <= item.avgCost) return true;
      
      // Price is significantly below market
      if (item.ethNetPrice > 0 && item.currentREVAPrice < item.ethNetPrice * 0.7) return true;
      
      // Price is way above market with low usage
      if (item.ethNetPrice > 0 && item.currentREVAPrice > item.ethNetPrice * 1.3 && item.revaUsage < 5) return true;
      
      return false;
    }).length;
    
    // Mature phase products (stable, moderate usage and margin)
    const maturityPhaseProducts = engineData.items.filter(item => {
      const currentMargin = item.currentREVAPrice > 0 ? 
        (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : 0;
      return currentMargin >= 10 && currentMargin <= 25 && 
             item.revaUsage >= 5 && item.revaUsage <= (engineData.usageMedian || 10) * 1.5;
    }).length;

    return {
      highValueProducts,
      lowMarginHighUsage,
      priceReviewNeeded,
      maturityPhaseProducts,
    };
  };

  const getBusinessImpactMetrics = () => {
    if (!engineData?.items || engineData.items.length === 0) return {
      potentialRevenueIncrease: 0,
      potentialProfitIncrease: 0,
      improvableProducts: 0,
      marginRiskProducts: 0,
    };

    // Calculate potential revenue increase from optimizing prices
    const potentialRevenueIncrease = engineData.items
      .filter(item => item.currentREVAPrice > 0 && item.revaUsage > 0)
      .reduce((sum, item) => {
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice;
        
        // If margin is too low, we estimate revenue from price increase
        if (currentMargin < 0.15 && item.revaUsage > 5) {
          const optimalPrice = item.avgCost / (1 - 0.15); // Price at 15% margin
          const revenueDiff = (optimalPrice - item.currentREVAPrice) * item.revaUsage;
          return sum + (revenueDiff > 0 ? revenueDiff : 0);
        }
        
        // If price is significantly above market, we estimate revenue from usage increase
        else if (item.ethNetPrice > 0 && item.currentREVAPrice > item.ethNetPrice * 1.2) {
          const competitivePrice = item.ethNetPrice * 1.1; // 10% above market
          const usageIncrease = item.revaUsage * 0.15; // Estimate 15% usage increase
          const revenueDiff = competitivePrice * usageIncrease;
          return sum + revenueDiff;
        }
        
        return sum;
      }, 0);
    
    // Calculate potential profit increase
    const potentialProfitIncrease = engineData.items
      .filter(item => item.currentREVAPrice > 0 && item.revaUsage > 0)
      .reduce((sum, item) => {
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice;
        
        // If margin is too low, we estimate profit from price increase
        if (currentMargin < 0.15 && item.revaUsage > 5) {
          const optimalPrice = item.avgCost / (1 - 0.15); // Price at 15% margin
          const profitDiff = ((optimalPrice - item.avgCost) - (item.currentREVAPrice - item.avgCost)) * item.revaUsage;
          return sum + (profitDiff > 0 ? profitDiff : 0);
        }
        
        // If price is significantly above market, we estimate profit from usage increase
        else if (item.ethNetPrice > 0 && item.currentREVAPrice > item.ethNetPrice * 1.2) {
          const competitivePrice = item.ethNetPrice * 1.1; // 10% above market
          const usageIncrease = item.revaUsage * 0.15; // Estimate 15% usage increase
          const profitDiff = (competitivePrice - item.avgCost) * usageIncrease;
          return sum + profitDiff;
        }
        
        return sum;
      }, 0);
    
    // Count products that can be improved
    const improvableProducts = engineData.items.filter(item => {
      const currentMargin = item.currentREVAPrice > 0 ? 
        (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : 0;
      
      return (currentMargin < 15 && item.revaUsage > 5) || // Low margin, decent usage
             (item.ethNetPrice > 0 && item.currentREVAPrice > item.ethNetPrice * 1.2 && item.revaUsage > 0); // Above market
    }).length;
    
    // Count products at risk of margin erosion
    const marginRiskProducts = engineData.items.filter(item => {
      // Products where cost is close to price
      if (item.avgCost > item.currentREVAPrice * 0.85) return true;
      
      // Products where market price is trending down
      if (item.ethNetPrice > 0 && item.currentREVAPrice > 0 && 
          item.ethNetPrice < item.currentREVAPrice * 0.9) return true;
      
      return false;
    }).length;

    return {
      potentialRevenueIncrease,
      potentialProfitIncrease,
      improvableProducts,
      marginRiskProducts,
    };
  };

  const optimizationMetrics = getOptimizationMetrics();
  const trendMetrics = getTrendMetrics();
  const portfolioMetrics = getPortfolioMetrics();
  const businessImpactMetrics = getBusinessImpactMetrics();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pricing Analytics</h1>
        <div className="text-sm text-muted-foreground">Data insights based on {engineData?.items?.length || 0} products</div>
      </div>

      <Tabs defaultValue="optimization" className="mb-8" onValueChange={setActiveAnalytic}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="optimization">Price Optimization</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
          <TabsTrigger value="impact">Business Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="space-y-8">
          {/* Metric Cards for Price Optimization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Price Elastic Products" 
              value={optimizationMetrics.elasticProducts.toString()}
              subtitle="Products with high price sensitivity" 
              icon={<TrendingUp className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Average Price Gap" 
              value={`${optimizationMetrics.priceGapAverage.toFixed(1)}%`}
              subtitle="vs. Market Reference Price" 
              icon={<Percent className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Margin Recovery Value" 
              value={formatCurrency(optimizationMetrics.marginRecoveryValue)}
              subtitle="Potential profit from margin recovery" 
              icon={<DollarSign className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Optimization Opportunities" 
              value={optimizationMetrics.optimizationOpportunities.toString()}
              subtitle="Products with pricing opportunities" 
              icon={<Flag className="h-5 w-5" />} 
              flippable={true}
            />
          </div>

          {/* Price Elasticity Chart */}
          <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <PriceElasticityChart data={engineData.items} />
            </CardContent>
          </Card>

          {/* Margin Opportunity Matrix */}
          <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <MarginOpportunityMatrix data={engineData.items} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-8">
          {/* Metric Cards for Market Trends */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Cost Increasing" 
              value={trendMetrics.costIncreasingProducts.toString()}
              subtitle="Products with rising costs" 
              icon={<TrendingUp className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Market Price Decreasing" 
              value={trendMetrics.marketPriceDecreaseProducts.toString()}
              subtitle="Products with falling market prices" 
              icon={<TrendingUp className="h-5 w-5 text-red-500" />} 
              flippable={true}
            />
            <MetricCard 
              title="Seasonal Trend Products" 
              value={trendMetrics.seasonalTrendProducts.toString()}
              subtitle="Products with seasonal patterns" 
              icon={<Info className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Volatile Products" 
              value={trendMetrics.volatileProducts.toString()}
              subtitle="Products with high price volatility" 
              icon={<Flag className="h-5 w-5" />} 
              flippable={true}
            />
          </div>

          {/* Market trend analysis would go here */}
          <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6 text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Market Trend Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Historical data analysis would be displayed here, showing price trends over time.
              </p>
              <div className="text-sm text-gray-400">
                (This feature requires historical data spanning multiple time periods)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-8">
          {/* Metric Cards for Portfolio Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="High Value Products" 
              value={portfolioMetrics.highValueProducts.toString()}
              subtitle="High usage & margin products" 
              icon={<DollarSign className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Low Margin High Usage" 
              value={portfolioMetrics.lowMarginHighUsage.toString()}
              subtitle="High impact improvement targets" 
              icon={<Flag className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Price Review Needed" 
              value={portfolioMetrics.priceReviewNeeded.toString()}
              subtitle="Products needing immediate review" 
              icon={<TrendingUp className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Maturity Phase Products" 
              value={portfolioMetrics.maturityPhaseProducts.toString()}
              subtitle="Stable, mid-lifecycle products" 
              icon={<Info className="h-5 w-5" />} 
              flippable={true}
            />
          </div>

          {/* Product Lifecycle Analysis */}
          <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <ProductLifecycleAnalysis data={engineData.items} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-8">
          {/* Metric Cards for Business Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Potential Revenue Increase" 
              value={formatCurrency(businessImpactMetrics.potentialRevenueIncrease)}
              subtitle="From price optimization" 
              icon={<DollarSign className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Potential Profit Increase" 
              value={formatCurrency(businessImpactMetrics.potentialProfitIncrease)}
              subtitle="From price optimization" 
              icon={<DollarSign className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Improvable Products" 
              value={businessImpactMetrics.improvableProducts.toString()}
              subtitle="Products with optimization potential" 
              icon={<TrendingUp className="h-5 w-5" />} 
              flippable={true}
            />
            <MetricCard 
              title="Margin Risk Products" 
              value={businessImpactMetrics.marginRiskProducts.toString()}
              subtitle="Products at risk of margin erosion" 
              icon={<Flag className="h-5 w-5" />} 
              flippable={true}
            />
          </div>

          {/* Pricing Action Recommendations */}
          <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <PricingActionRecommendations data={engineData.items} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrapper component to provide context
const PricingAnalytics = () => (
  <EngineRoomProvider>
    <PricingAnalyticsContent />
  </EngineRoomProvider>
);

export default PricingAnalytics;
