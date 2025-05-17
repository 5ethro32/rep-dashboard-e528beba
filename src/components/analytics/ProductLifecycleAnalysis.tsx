
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DonutChart from '@/components/DonutChart';

interface ProductLifecycleAnalysisProps {
  data: any[];
}

const LIFECYCLE_COLORS = {
  introduction: '#3b82f6', // Blue
  growth: '#10b981',       // Green
  maturity: '#eab308',     // Yellow
  decline: '#f97316',      // Orange
  end: '#ef4444',          // Red
};

// Define a DataItem interface to match DonutChart expectations
interface DataItem {
  name: string;
  value: number;
  color: string;
}

const ProductLifecycleAnalysis: React.FC<ProductLifecycleAnalysisProps> = ({ data }) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const lifecycleData = useMemo(() => {
    if (!data || data.length === 0) return { summary: [], products: {} };

    // Filter to only include products with all necessary data points
    const filteredData = data.filter(item => 
      item.currentREVAPrice > 0 && 
      item.avgCost > 0
    );

    // Calculate lifecycle stage for each product
    const productsWithLifecycle = filteredData.map(item => {
      const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
      const usage = item.revaUsage || 0;
      
      // Determine lifecycle stage based on usage and margin
      let stage = '';
      let stageReason = '';
      
      if (usage === 0) {
        stage = 'end';
        stageReason = 'No recent usage';
      } else if (usage < 5 && currentMargin < 10) {
        stage = 'end';
        stageReason = 'Low usage, low margin';
      } else if (usage < 5 && currentMargin >= 20) {
        stage = 'introduction';
        stageReason = 'Low usage, high margin';
      } else if (usage >= 20 && currentMargin >= 25) {
        stage = 'growth';
        stageReason = 'High usage, high margin';
      } else if (usage >= 10 && currentMargin >= 15 && currentMargin < 25) {
        stage = 'maturity';
        stageReason = 'Good usage, stable margin';
      } else if (usage >= 10 && currentMargin < 10) {
        stage = 'decline';
        stageReason = 'Good usage, but poor margin';
      } else {
        stage = 'maturity';
        stageReason = 'Average usage and margin';
      }
      
      return {
        ...item,
        margin: currentMargin.toFixed(1),
        lifecycle: {
          stage,
          reason: stageReason
        }
      };
    });

    // Group by lifecycle stage for chart
    const stageCounts = productsWithLifecycle.reduce((acc, item) => {
      const stage = item.lifecycle.stage;
      if (!acc[stage]) acc[stage] = 0;
      acc[stage]++;
      return acc;
    }, {});

    // Convert to array and ensure value is a number for the chart
    const summary: DataItem[] = Object.entries(stageCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
      value: Number(value), // Ensure value is a number
      color: LIFECYCLE_COLORS[name as keyof typeof LIFECYCLE_COLORS] || '#777777'
    }));

    // Group products by lifecycle stage
    const products = productsWithLifecycle.reduce((acc, item) => {
      const stage = item.lifecycle.stage;
      if (!acc[stage]) acc[stage] = [];
      
      acc[stage].push({
        id: item.id,
        name: item.description?.substring(0, 30) || 'Unknown',
        margin: item.margin,
        usage: item.revaUsage || 0,
        price: item.currentREVAPrice,
        cost: item.avgCost,
        reason: item.lifecycle.reason
      });
      
      return acc;
    }, {});

    // Sort products in each category by usage (high to low)
    Object.keys(products).forEach(stage => {
      products[stage].sort((a, b) => b.usage - a.usage);
    });

    return { summary, products };
  }, [data]);

  if (lifecycleData.summary.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Product Lifecycle Analysis</h3>
        <p className="text-muted-foreground">Insufficient data for lifecycle analysis</p>
      </div>
    );
  }

  const renderLifecycleStageDescription = (stage: string) => {
    switch(stage) {
      case 'introduction':
        return "New products with typically high margins but lower usage. These products are in the early phase of their lifecycle.";
      case 'growth':
        return "Products showing strong growth with high usage and healthy margins. These are the stars of your portfolio.";
      case 'maturity':
        return "Established products with stable usage and reasonable margins. The backbone of the business.";
      case 'decline':
        return "Products with good usage but declining margins, often due to market competition or cost increases.";
      case 'end':
        return "Products with minimal usage and poor margins. Consider discontinuing or revitalizing these products.";
      default:
        return "";
    }
  };

  const getProductsToShow = () => {
    if (selectedStage === 'all') {
      // Combine top products from each stage
      return Object.entries(lifecycleData.products).map(([stage, products]) => ({
        stage,
        products: (products as any[]).slice(0, 3) // Take top 3 from each stage
      }));
    } else {
      // Show all products from the selected stage
      return [{ 
        stage: selectedStage, 
        products: lifecycleData.products[selectedStage] || [] 
      }];
    }
  };

  const calculateStageStats = (stage: string) => {
    const products = lifecycleData.products[stage] || [];
    if (products.length === 0) return { avgMargin: 0, totalUsage: 0, count: 0 };
    
    const totalMargin = products.reduce((sum, p) => sum + parseFloat(p.margin), 0);
    const totalUsage = products.reduce((sum, p) => sum + p.usage, 0);
    
    return {
      avgMargin: totalMargin / products.length,
      totalUsage,
      count: products.length
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Product Lifecycle Analysis</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Categorizes products by lifecycle stage based on usage patterns and margins
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="h-80">
            {/* Use DonutChart with correctly typed data */}
            <DonutChart 
              data={lifecycleData.summary}
              innerValue={`${lifecycleData.summary.length}`} 
              innerLabel="Stages" 
            />
          </div>
          
          <div className="mt-4 space-y-2 p-3 bg-gray-800/30 border border-white/10 rounded-md">
            <h4 className="text-sm font-medium mb-2">Lifecycle Stage Stats</h4>
            <div className="grid grid-cols-5 gap-1 text-xs">
              {Object.keys(LIFECYCLE_COLORS).map(stage => {
                const stats = calculateStageStats(stage);
                return (
                  <div 
                    key={stage} 
                    className="flex flex-col items-center p-2 rounded-md"
                    style={{ backgroundColor: `${LIFECYCLE_COLORS[stage as keyof typeof LIFECYCLE_COLORS]}20` }}
                  >
                    <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: LIFECYCLE_COLORS[stage as keyof typeof LIFECYCLE_COLORS] }} />
                    <span className="font-medium capitalize">{stage}</span>
                    <span className="text-gray-400">{stats.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedStage}>
            <TabsList className="grid grid-cols-6 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="introduction">Introduction</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="maturity">Maturity</TabsTrigger>
              <TabsTrigger value="decline">Decline</TabsTrigger>
              <TabsTrigger value="end">End of Life</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStage} className="mt-0">
              {selectedStage !== 'all' && (
                <Card className="mb-4 border border-white/10 bg-gray-800/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <p className="text-sm">{renderLifecycleStageDescription(selectedStage)}</p>
                  </CardContent>
                </Card>
              )}
              
              {getProductsToShow().map(({ stage, products }) => (
                <div key={stage} className="mb-4">
                  {selectedStage === 'all' && (
                    <h4 className="text-md font-medium mb-2 capitalize" style={{ color: LIFECYCLE_COLORS[stage as keyof typeof LIFECYCLE_COLORS] }}>
                      {stage} Stage Products
                    </h4>
                  )}
                  
                  <div className="rounded-md border border-white/10 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-[80px]">Margin</TableHead>
                          <TableHead className="w-[80px]">Usage</TableHead>
                          <TableHead className="w-[100px]">Price</TableHead>
                          {selectedStage !== 'all' && (
                            <TableHead className="w-[180px]">Classification Reason</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(products as any[]).slice(0, selectedStage === 'all' ? 3 : 10).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.margin}%</TableCell>
                            <TableCell>{item.usage}</TableCell>
                            <TableCell>£{item.price.toFixed(2)}</TableCell>
                            {selectedStage !== 'all' && (
                              <TableCell className="text-xs text-muted-foreground">{item.reason}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-3 px-4">
        <p>
          Products are classified into lifecycle stages based on their usage patterns and margin performance. 
          This analysis helps identify which products need different pricing strategies based on their position 
          in the product lifecycle.
        </p>
      </div>
    </div>
  );
};

export default ProductLifecycleAnalysis;
