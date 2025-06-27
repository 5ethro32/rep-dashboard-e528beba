import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UploadCloud, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Download,
  Info,
  Star,
  Clock,
  Flag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/MetricCard';
import { 
  processInventoryExcelFile, 
  exportInventoryAnalysisToExcel,
  ProcessedInventoryData,
  ProcessedInventoryItem
} from '@/utils/inventory-analysis-utils';
import { formatCurrency } from '@/utils/formatting-utils';

// Import chart components from existing charts
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

const InventoryAnalyticsContent: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<ProcessedInventoryData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel (.xlsx) or CSV file.",
        variant: "destructive"
      });
      return;
    }

    setErrorMessage(null);
    try {
      setIsUploading(true);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 200);

      // Process the file
      const processedData = await processInventoryExcelFile(file);
      
      // Store in localStorage for persistence (with error handling for quota exceeded)
      try {
        localStorage.setItem('inventoryAnalysisData', JSON.stringify(processedData));
      } catch (error) {
        console.warn('Failed to store data in localStorage (quota exceeded):', error);
        // Clear any existing data and try storing just essential summary
        localStorage.removeItem('inventoryAnalysisData');
        try {
          const essentialData = {
            fileName: processedData.fileName,
            totalProducts: processedData.totalProducts,
            summaryStats: processedData.summaryStats,
            // Store only first 100 items for display
            analyzedItems: processedData.analyzedItems.slice(0, 100),
            overstockItems: processedData.overstockItems.slice(0, 50),
            priorityIssues: processedData.priorityIssues.slice(0, 50),
            velocityBreakdown: processedData.velocityBreakdown,
            trendBreakdown: processedData.trendBreakdown,
            strategyBreakdown: processedData.strategyBreakdown
          };
          localStorage.setItem('inventoryAnalysisData', JSON.stringify(essentialData));
        } catch (secondError) {
          console.warn('Failed to store even essential data, proceeding without persistence');
        }
      }
      setInventoryData(processedData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "File processed successfully",
        description: `Analyzed ${processedData.totalProducts} products with ${processedData.priorityIssues.length} priority issues identified.`
      });

      // Show additional message if localStorage storage was limited
      const savedData = localStorage.getItem('inventoryAnalysisData');
      if (savedData) {
        const parsedSavedData = JSON.parse(savedData);
        if (parsedSavedData.analyzedItems?.length < processedData.analyzedItems.length) {
          toast({
            title: "Large dataset detected",
            description: "Data persistence limited due to browser storage constraints. All analysis features remain fully functional.",
            variant: "default"
          });
        }
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error processing file:', error);
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);
      
      toast({
        title: "Error processing file",
        description: errorMsg,
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [toast]);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle click upload
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Handle export
  const handleExport = () => {
    if (inventoryData) {
      exportInventoryAnalysisToExcel(inventoryData);
      toast({
        title: "Export successful",
        description: "Inventory analysis exported to Excel file."
      });
    }
  };

  // Handle new upload (clear existing data)
  const handleNewUpload = () => {
    localStorage.removeItem('inventoryAnalysisData');
    setInventoryData(null);
    setSelectedTab('overview');
    setStarredItems(new Set());
  };

  // Toggle star for item
  const handleToggleStar = (itemId: string) => {
    setStarredItems(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(itemId)) {
        newStarred.delete(itemId);
      } else {
        newStarred.add(itemId);
      }
      return newStarred;
    });
  };

  // Load data from localStorage on component mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('inventoryAnalysisData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Add missing arrays if they don't exist (for backward compatibility)
        if (!parsedData.overstockItems) {
          parsedData.overstockItems = parsedData.analyzedItems?.filter((item: any) => item.isOverstocked) || [];
        }
        if (!parsedData.rawData) {
          parsedData.rawData = [];
        }
        setInventoryData(parsedData);
      } catch (error) {
        console.error('Error loading saved data:', error);
        localStorage.removeItem('inventoryAnalysisData');
      }
    }
  }, []);

  // If no data, show upload interface
  if (!inventoryData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Pharmaceutical Inventory Analysis</h1>
          <p className="text-gray-400">Upload your inventory file to begin comprehensive analysis</p>
        </div>

        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all mt-4
            ${isUploading ? "pointer-events-none" : "border-gray-700 hover:border-primary/50"}`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.csv"
            onChange={handleFileInputChange}
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Upload Pharmaceutical Inventory Sheet</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your Excel or CSV file, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Required columns: stockcode, description, quantity_available, packs_sold_avg_last_six_months, avg_cost
              </p>
              <p className="text-xs text-muted-foreground">
                Optional: next_cost, min_cost, last_po_cost, competitor prices (Nupharm, AAH2, ETH_LIST, LEXON2, AVER), tariffs (SDT, EDT)
              </p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-6 w-full max-w-md mx-auto">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm mt-2 text-muted-foreground">
                Processing file... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5" />
              <div>
                <AlertTitle>Error processing file</AlertTitle>
                <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
                <AlertDescription className="mt-2">
                  <p className="font-medium">Expected file structure:</p>
                  <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                    <li>Excel file with 'maintenance' sheet (or first sheet used)</li>
                    <li>Required: stockcode, description, quantity_available, packs_sold_avg_last_six_months, avg_cost</li>
                    <li>Optional: quantity_ringfenced, quantity_on_order, next_cost, competitor prices, tariffs (SDT, EDT)</li>
                  </ul>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </div>
    );
  }

  // Main analytics dashboard with data
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Inventory Analysis Results</h1>
          <p className="text-gray-400">{inventoryData.fileName} • {inventoryData.totalProducts.toLocaleString()} products analyzed</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={handleNewUpload} className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4" />
            New Upload
          </Button>
        </div>
      </div>

      {/* Summary Metrics - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard 
          title="Total Products"
          value={inventoryData.summaryStats.totalProducts.toLocaleString()}
          subtitle={`${inventoryData.summaryStats.totalOverstockItems} overstocked`}
          icon={<Package className="h-5 w-5" />}
          iconPosition="right"
          flippable={true}
        />
        
        <MetricCard 
          title="Stock Value"
          value={formatCurrency(inventoryData.summaryStats.totalStockValue)}
          subtitle="Physical inventory"
          icon={<DollarSign className="h-5 w-5" />}
          iconPosition="right"
          flippable={true}
        />
        
        <MetricCard 
          title="On Order Value"
          value={formatCurrency(inventoryData.summaryStats.totalOnOrderValue)}
          subtitle="Future commitments"
          icon={<TrendingUp className="h-5 w-5" />}
          iconPosition="right"
          flippable={true}
        />
        
        <MetricCard 
          title="Overstock Value"
          value={formatCurrency(inventoryData.summaryStats.totalOverstockStockValue)}
          subtitle={`${inventoryData.summaryStats.overstockPercentage.toFixed(1)}% of total`}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconPosition="right"
          change={{
            value: `${inventoryData.summaryStats.overstockPercentage.toFixed(1)}%`,
            type: inventoryData.summaryStats.overstockPercentage > 20 ? 'decrease' : 'neutral'
          }}
          flippable={true}
        />
      </div>

      {/* Summary Metrics - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Out of Stock"
          value={inventoryData.summaryStats.outOfStockItems.toLocaleString()}
          subtitle={`${inventoryData.summaryStats.outOfStockFastMovers} fast movers`}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          iconPosition="right"
          flippable={true}
          change={{
            value: inventoryData.summaryStats.outOfStockFastMovers > 0 ? 'Critical' : 'OK',
            type: inventoryData.summaryStats.outOfStockFastMovers > 0 ? 'decrease' : 'increase'
          }}
        />
        
        <MetricCard 
          title="Margin Opportunities"
          value={inventoryData.summaryStats.marginOpportunityItems.toLocaleString()}
          subtitle={`${formatCurrency(inventoryData.summaryStats.marginOpportunityValue)} potential`}
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          iconPosition="right"
          flippable={true}
          change={{
            value: inventoryData.summaryStats.marginOpportunityValue > 0 ? 'Revenue+' : 'None',
            type: inventoryData.summaryStats.marginOpportunityValue > 0 ? 'increase' : 'neutral'
          }}
        />
        
        <MetricCard 
          title="Cost Disadvantage"
          value={inventoryData.summaryStats.costDisadvantageItems.toLocaleString()}
          subtitle={`${formatCurrency(inventoryData.summaryStats.costDisadvantageValue)} at risk`}
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          iconPosition="right"
          flippable={true}
          change={{
            value: inventoryData.summaryStats.costDisadvantageValue > 0 ? 'Risk' : 'OK',
            type: inventoryData.summaryStats.costDisadvantageValue > 0 ? 'decrease' : 'increase'
          }}
        />
        
        <MetricCard 
          title="Stock Risk"
          value={inventoryData.summaryStats.stockRiskItems.toLocaleString()}
          subtitle={`${formatCurrency(inventoryData.summaryStats.stockRiskValue)} <2wks supply`}
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          iconPosition="right"
          flippable={true}
          change={{
            value: inventoryData.summaryStats.stockRiskItems > 0 ? 'Action Needed' : 'OK',
            type: inventoryData.summaryStats.stockRiskItems > 0 ? 'decrease' : 'increase'
          }}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-8">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex gap-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="all" className="flex gap-2">
            All Items
            <Badge variant="secondary" className="bg-blue-500 text-white rounded-full">
              {inventoryData.totalProducts.toLocaleString()}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overstock" className="flex gap-2">
            Overstock
            <Badge variant="secondary" className="bg-amber-500 text-white rounded-full">
              {inventoryData.summaryStats.totalOverstockItems}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex gap-2">
            Priority Issues
            <Badge variant="secondary" className="bg-red-500 text-white rounded-full">
              {inventoryData.priorityIssues.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex gap-2">
            Watchlist
            <Badge variant="secondary" className="bg-orange-500 text-white rounded-full">
              {inventoryData.summaryStats.watchlistCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="starred" className="flex gap-2">
            <Star className="h-4 w-4" />
            Starred
            <Badge variant="secondary" className="bg-yellow-500 text-white rounded-full">
              {starredItems.size}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <InventoryOverview data={inventoryData} />
        </TabsContent>
        
        <TabsContent value="all" className="space-y-6">
          <AllItemsAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="overstock" className="space-y-6">
          <OverstockAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="priority" className="space-y-6">
          <PriorityIssuesAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="watchlist" className="space-y-6">
          <WatchlistAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="starred" className="space-y-6">
          <StarredItemsAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Overview component with charts and breakdowns
const InventoryOverview: React.FC<{ data: ProcessedInventoryData }> = ({ data }) => {
  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  return (
    <div className="space-y-6">
      {/* Velocity Distribution Chart */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Velocity Category Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.velocityBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="category" 
                stroke="#9CA3AF"
                tickFormatter={(value) => `Cat ${value}`}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [
                  name === 'itemCount' ? `${value} items` : formatCurrency(value as number),
                  name === 'itemCount' ? 'Items' : 'Stock Value'
                ]}
              />
              <Bar dataKey="itemCount" fill="#10B981" name="itemCount" />
              <Bar dataKey="stockValue" fill="#F59E0B" name="stockValue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Distribution */}
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Price Trend Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.trendBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="itemCount"
                  nameKey="direction"
                >
                  {data.trendBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Distribution */}
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Pricing Strategy Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.strategyBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="stockValue"
                  nameKey="strategy"
                >
                  {data.strategyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Stock Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// All Items Analysis - shows complete inventory with all data points
const AllItemsAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get all items
  const allItems = data.analyzedItems;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = allItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || 
        (filterCategory === 'overstock' && item.isOverstocked) ||
        (filterCategory === 'watchlist' && item.watchlist === '⚠️') ||
        (filterCategory === 'fast-mover' && typeof item.velocityCategory === 'number' && item.velocityCategory <= 3) ||
        (filterCategory === 'high-value' && item.stockValue >= 10000) ||
        (filterCategory === 'starred' && starredItems.has(item.id)) ||
        (filterCategory === 'margin-opportunity' && item.lowestMarketPrice && item.avg_cost < (item.lowestMarketPrice * 0.9)) ||
        (filterCategory === 'cost-disadvantage' && (() => {
          if (!item.lowestMarketPrice) return false;
          const competitors = ['Nupharm', 'AAH2', 'ETH_LIST', 'LEXON2'];
          const prices: number[] = [];
          competitors.forEach(competitor => {
            const price = item[competitor as keyof typeof item] as number;
            if (price && price > 0) {
              prices.push(price);
            }
          });
          if (prices.length === 0) return false;
          const highestPrice = Math.max(...prices);
          return item.avg_cost > (highestPrice * 1.05);
        })()) ||
        (filterCategory === 'out-of-stock' && item.quantity_available === 0 && item.quantity_ringfenced === 0 && item.quantity_on_order === 0) ||
        (filterCategory === 'stock-risk' && item.packs_sold_avg_last_six_months > 0 && (item.currentStock / item.packs_sold_avg_last_six_months) < 0.5);
      
      return matchesSearch && matchesCategory;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'item':
        case 'stockcode':
          aValue = a.stockcode;
          bValue = b.stockcode;
          break;
        case 'stockValue':
          aValue = a.stockValue;
          bValue = b.stockValue;
          break;
        case 'averageCost':
          aValue = a.avg_cost || a.AVER || 0;
          bValue = b.avg_cost || b.AVER || 0;
          break;
        case 'currentStock':
          aValue = a.currentStock || a.stock || 0;
          bValue = b.currentStock || b.stock || 0;
          break;
        case 'monthsOfStock':
          aValue = a.monthsOfStock || 0;
          bValue = b.monthsOfStock || 0;
          break;
        case 'velocityCategory':
          aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 99;
          bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 99;
          break;
        case 'trendDirection':
          // Custom sorting for trend: DOWN > STABLE > UP > N/A
          const trendOrder = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
          aValue = trendOrder[a.trendDirection as keyof typeof trendOrder] || 4;
          bValue = trendOrder[b.trendDirection as keyof typeof trendOrder] || 4;
          break;
        case 'nbp':
          aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
          bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
          break;
        case 'lowestComp':
          aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
          bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
          break;
        case 'price':
          aValue = a.AVER || 0;
          bValue = b.AVER || 0;
          break;
        case 'sdt':
          aValue = a.SDT || 0;
          bValue = b.SDT || 0;
          break;
        case 'edt':
          aValue = a.EDT || 0;
          bValue = b.EDT || 0;
          break;
        default:
          aValue = a.stockValue;
          bValue = b.stockValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [allItems, searchTerm, filterCategory, sortField, sortDirection, starredItems]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Calculate summary stats for filtered items
  const filteredStats = useMemo(() => {
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.stockValue || 0), 0);
    const overstockItems = filteredItems.filter(item => item.isOverstocked);
    const watchlistItems = filteredItems.filter(item => item.watchlist === '⚠️');
    const starredCount = filteredItems.filter(item => starredItems.has(item.id)).length;
    
    return {
      totalItems: filteredItems.length,
      totalValue,
      overstockCount: overstockItems.length,
      watchlistCount: watchlistItems.length,
      starredCount
    };
  }, [filteredItems, starredItems]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{filteredStats.totalItems.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Items</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(filteredStats.totalValue)}</div>
            <div className="text-sm text-gray-400">Total Value</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{filteredStats.overstockCount}</div>
            <div className="text-sm text-gray-400">Overstock Items</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{filteredStats.starredCount}</div>
            <div className="text-sm text-gray-400">Starred Items</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by stock code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="overstock">Overstock &gt;6 months</SelectItem>
                <SelectItem value="watchlist">Watchlist Only</SelectItem>
                <SelectItem value="fast-mover">Fast Movers (Cat 1-3)</SelectItem>
                <SelectItem value="high-value">High Value (£10k+)</SelectItem>
                <SelectItem value="starred">Starred Items</SelectItem>
                <SelectItem value="margin-opportunity">💰 Margin Opportunities</SelectItem>
                <SelectItem value="cost-disadvantage">⚠️ Cost Disadvantage</SelectItem>
                <SelectItem value="out-of-stock">🚨 Out of Stock</SelectItem>
                <SelectItem value="stock-risk">⏰ Stock Risk &lt;2wks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredStats.totalItems.toLocaleString()} of {allItems.length.toLocaleString()} inventory items
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('item')}>
                    Item {sortField === 'item' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('averageCost')}>
                    Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('velocityCategory')}>
                    Velocity {sortField === 'velocityCategory' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('trendDirection')}>
                    Trend {sortField === 'trendDirection' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300">
                    Watch
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('nbp')}>
                    NBP {sortField === 'nbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  return (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-white">{item.stockcode}</div>
                          <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                        </div>
                      </td>
                      <td className="p-3 text-right text-white font-semibold">
                        {formatCurrency(item.stockValue)}
                      </td>
                                             <td className="p-3 text-right text-gray-300">
                         {item.avg_cost || item.AVER ? formatCurrency(item.avg_cost || item.AVER) : 'N/A'}
                       </td>
                      <td className="p-3 text-right text-gray-300">
                        {(item.currentStock || item.stock || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                                {item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                        {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-lg font-bold ${getTrendColor(item.trendDirection)}`}>
                          {item.trendDirection === 'UP' ? '↑' :
                           item.trendDirection === 'DOWN' ? '↓' :
                           item.trendDirection === 'STABLE' ? '−' : '?'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                          {item.watchlist || '−'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-purple-400 font-semibold">
                        {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                      </td>
                      <td className="p-3 text-right text-green-400 font-semibold">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.nextBuyingPrice ? formatCurrency(item.nextBuyingPrice) : 
                                 (item.nbp ? formatCurrency(item.nbp) : 
                                  (item.next_cost ? formatCurrency(item.next_cost) : 
                                   (item.min_cost ? formatCurrency(item.min_cost) : 
                                    (item.last_po_cost ? formatCurrency(item.last_po_cost) : 'N/A'))))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="space-y-1">
                                {item.next_cost && item.next_cost > 0 && (
                                  <div className="text-sm">Next Cost: {formatCurrency(item.next_cost)}</div>
                                )}
                                {item.min_cost && item.min_cost > 0 && (
                                  <div className="text-sm">Min Cost: {formatCurrency(item.min_cost)}</div>
                                )}
                                {item.last_po_cost && item.last_po_cost > 0 && (
                                  <div className="text-sm">Last PO Cost: {formatCurrency(item.last_po_cost)}</div>
                                )}
                                {!item.next_cost && !item.min_cost && !item.last_po_cost && (
                                  <div className="text-sm">No NBP data available</div>
                                )}
                              </div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-3 text-right text-blue-400 font-semibold">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                                 (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                  (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                   (item.AAH2 ? formatCurrency(item.AAH2) : 
                                    (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                              <div className="space-y-1">
                                {[
                                  { name: 'Nupharm', price: item.Nupharm },
                                  { name: 'AAH2', price: item.AAH2 },
                                  { name: 'ETH LIST', price: item.ETH_LIST },
                                  { name: 'LEXON2', price: item.LEXON2 }
                                ].filter(comp => comp.price && comp.price > 0)
                                 .sort((a, b) => a.price - b.price)
                                 .map((comp, idx) => (
                                  <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                                ))}
                                {![item.Nupharm, item.AAH2, item.ETH_LIST, item.LEXON2].some(price => price && price > 0) && (
                                  <div className="text-sm">No competitor pricing available</div>
                                )}
                              </div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-3 text-right text-cyan-400 font-semibold">
                        {item.SDT ? formatCurrency(item.SDT) : 'N/A'}
                      </td>
                      <td className="p-3 text-right text-indigo-400 font-semibold">
                        {item.EDT ? formatCurrency(item.EDT) : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onToggleStar(item.id)}
                          className={`text-lg hover:scale-110 transition-transform ${
                            starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                          }`}
                        >
                          {starredItems.has(item.id) ? '★' : '☆'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No items found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card className="border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold">All Items View - Usage Tips</h3>
              <ul className="text-gray-300 text-sm mt-2 space-y-1">
                <li>• Use filters to focus on specific categories: overstock, watchlist, fast movers, or high value items</li>
                <li>• Sort by any column to identify patterns - try sorting by months of stock or velocity category</li>
                <li>• Star important items for quick access in the Starred tab</li>
                <li>• Hover over data points for detailed tooltips with additional information</li>
                <li>• Items with &gt;6 months of stock are highlighted in red in the Months column</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Overstock Analysis with detailed data table
const OverstockAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get overstock items
  const overstockItems = data.overstockItems;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = overstockItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || 
        (filterCategory === 'watchlist' && item.watchlist === '⚠️') ||
        (filterCategory === 'fast-mover' && typeof item.velocityCategory === 'number' && item.velocityCategory <= 3) ||
        (filterCategory === 'high-value' && item.stockValue >= 10000);
      
      return matchesSearch && matchesCategory;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'stockcode':
          aValue = a.stockcode;
          bValue = b.stockcode;
          break;
        case 'description':
          aValue = a.description;
          bValue = b.description;
          break;
        case 'stockValue':
          aValue = a.stockValue;
          bValue = b.stockValue;
          break;
        case 'monthsOfStock':
          aValue = a.monthsOfStock;
          bValue = b.monthsOfStock;
          break;
        case 'velocityCategory':
          aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 99;
          bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 99;
          break;
        case 'currentStock':
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case 'trendDirection':
          aValue = a.trendDirection;
          bValue = b.trendDirection;
          break;
        case 'sdt':
          aValue = a.SDT || 0;
          bValue = b.SDT || 0;
          break;
        case 'edt':
          aValue = a.EDT || 0;
          bValue = b.EDT || 0;
          break;
        default:
          aValue = a.stockValue;
          bValue = b.stockValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [overstockItems, searchTerm, filterCategory, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{overstockItems.length}</div>
            <div className="text-sm text-gray-400">Overstock Items</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(data.summaryStats.totalOverstockStockValue)}</div>
            <div className="text-sm text-gray-400">Current Stock Value</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(data.summaryStats.totalOverstockPotentialValue)}</div>
            <div className="text-sm text-gray-400">Total Potential Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by stock code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="watchlist">Watchlist Only</SelectItem>
                <SelectItem value="fast-mover">Fast Movers (Cat 1-3)</SelectItem>
                <SelectItem value="high-value">High Value (£10k+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredItems.length} of {overstockItems.length} overstock items
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300">Avg Cost</th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('velocityCategory')}>
                    Velocity {sortField === 'velocityCategory' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('trendDirection')}>
                    Trend {sortField === 'trendDirection' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300">Watch</th>
                  <th className="text-right p-3 text-gray-300">Price</th>
                  <th className="text-right p-3 text-gray-300">NBP</th>
                  <th className="text-right p-3 text-gray-300">Lowest Comp</th>
                  <th className="text-right p-3 text-gray-300">SDT</th>
                  <th className="text-right p-3 text-gray-300">EDT</th>
                  <th className="text-center p-3 text-gray-300">Star</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-white font-mono text-sm font-semibold">{item.stockcode}</span>
                        <span className="text-gray-400 text-xs max-w-xs truncate" title={item.description}>
                          {item.description}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right text-white font-semibold">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {formatCurrency(item.avg_cost || 0)}
                    </td>
                    <td className="p-3 text-right text-white font-semibold">
                      {(item.currentStock || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-semibold text-orange-400">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                      {typeof item.velocityCategory === 'number' ? `Cat ${item.velocityCategory}` : 'N/A'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-lg font-bold ${getTrendColor(item.trendDirection)}`}>
                        {item.trendDirection === 'UP' ? '↑' :
                         item.trendDirection === 'DOWN' ? '↓' :
                         item.trendDirection === 'STABLE' ? '−' : '?'}
                      </span>
                    </td>
                    <td className="p-3 text-center text-lg">
                      {item.watchlist === '⚠️' ? (
                        <span className="text-yellow-400">⚠️</span>
                      ) : (
                        <span className="text-gray-600">−</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-purple-400 font-semibold">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-green-400 font-semibold">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.nextBuyingPrice ? formatCurrency(item.nextBuyingPrice) : 
                               (item.nbp ? formatCurrency(item.nbp) : 
                                (item.next_cost ? formatCurrency(item.next_cost) : 
                                 (item.min_cost ? formatCurrency(item.min_cost) : 
                                  (item.last_po_cost ? formatCurrency(item.last_po_cost) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              {item.next_cost && item.next_cost > 0 && (
                                <div className="text-sm">Next Cost: {formatCurrency(item.next_cost)}</div>
                              )}
                              {item.min_cost && item.min_cost > 0 && (
                                <div className="text-sm">Min Cost: {formatCurrency(item.min_cost)}</div>
                              )}
                              {item.last_po_cost && item.last_po_cost > 0 && (
                                <div className="text-sm">Last PO Cost: {formatCurrency(item.last_po_cost)}</div>
                              )}
                              {!item.next_cost && !item.min_cost && !item.last_po_cost && (
                                <div className="text-sm">No NBP data available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-blue-400 font-semibold">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                               (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                 (item.AAH2 ? formatCurrency(item.AAH2) : 
                                  (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                            <div className="space-y-1">
                              {[
                                { name: 'Nupharm', price: item.Nupharm },
                                { name: 'AAH2', price: item.AAH2 },
                                { name: 'ETH LIST', price: item.ETH_LIST },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-cyan-400 font-semibold">
                      {item.SDT ? formatCurrency(item.SDT) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-indigo-400 font-semibold">
                      {item.EDT ? formatCurrency(item.EDT) : 'N/A'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`text-lg hover:scale-110 transition-transform ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                        }`}
                      >
                        {starredItems.has(item.id) ? '★' : '☆'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No overstock items found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PriorityIssuesAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [sortField, setSortField] = useState<string>('impactValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterIssueType, setFilterIssueType] = useState<string>('all');

  // Get priority issues
  const priorityIssues = data.priorityIssues;
  
  // Debug: Log first few priority issues to understand data structure
  React.useEffect(() => {
    if (priorityIssues.length > 0) {
      console.log('🔍 Priority Issues Debug - First 3 items:');
      priorityIssues.slice(0, 3).forEach((issue, idx) => {
        console.log(`Issue ${idx + 1}:`, {
          stockcode: issue.item.stockcode,
          averageUsage: issue.item.averageUsage,
          packs_sold_avg_last_six_months: issue.item.packs_sold_avg_last_six_months,
          nextBuyingPrice: issue.item.nextBuyingPrice,
          nbp: issue.item.nbp,
          next_cost: issue.item.next_cost,
          min_cost: issue.item.min_cost,
          last_po_cost: issue.item.last_po_cost,
          bestCompetitorPrice: issue.item.bestCompetitorPrice,
          lowestMarketPrice: issue.item.lowestMarketPrice,
          Nupharm: issue.item.Nupharm,
          AAH2: issue.item.AAH2,
          LEXON2: issue.item.LEXON2
        });
      });
    }
  }, [priorityIssues]);

  // Filter and sort issues
  const filteredIssues = useMemo(() => {
    let filtered = priorityIssues.filter(issue => {
      const matchesSearch = searchTerm === '' || 
        issue.item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.recommendation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
      const matchesIssueType = filterIssueType === 'all' || issue.type === filterIssueType;
      
      return matchesSearch && matchesSeverity && matchesIssueType;
    });

    // Sort issues
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'stockcode':
          aValue = a.item.stockcode;
          bValue = b.item.stockcode;
          break;
        case 'severity':
          // Custom severity order: critical > high > medium > low
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'impactValue':
          aValue = a.impactValue;
          bValue = b.impactValue;
          break;
        case 'stockValue':
          aValue = a.item.stockValue;
          bValue = b.item.stockValue;
          break;
        case 'velocityCategory':
          aValue = typeof a.item.velocityCategory === 'number' ? a.item.velocityCategory : 99;
          bValue = typeof b.item.velocityCategory === 'number' ? b.item.velocityCategory : 99;
          break;
        case 'sdt':
          aValue = a.item.SDT || 0;
          bValue = b.item.SDT || 0;
          break;
        case 'edt':
          aValue = a.item.EDT || 0;
          bValue = b.item.EDT || 0;
          break;
        default:
          aValue = a.impactValue;
          bValue = b.impactValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [priorityIssues, searchTerm, filterSeverity, filterIssueType, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'HIGH_VALUE_OVERSTOCK_FAST_MOVER': return 'High Value Overstock (Fast Mover)';
      case 'WATCHLIST_DECLINING_PRICE': return 'Watchlist Item with Declining Price';
      case 'COMPETITIVE_DISADVANTAGE': return 'Competitive Pricing Disadvantage';
      case 'EXCESSIVE_MONTHS_STOCK': return 'Excessive Months of Stock';
      default: return type.replace(/_/g, ' ').toLowerCase();
    }
  };

  const getTypeAbbreviation = (type: string) => {
    switch (type) {
      case 'HIGH_VALUE_OVERSTOCK_FAST_MOVER': return 'HVO';
      case 'WATCHLIST_DECLINING_PRICE': return 'WDP';
      case 'COMPETITIVE_DISADVANTAGE': return 'COMP';
      case 'EXCESSIVE_MONTHS_STOCK': return 'EMS';
      default: return 'UNK';
    }
  };

  const formatMonthsTooltip = (item: any) => {
    const months = (item.monthsOfStock || 0).toFixed(1);
    const usage = item.averageUsage || item.packs_sold_avg_last_six_months;
    const usageText = usage ? `${usage.toFixed(0)} packs/month` : 'No usage data';
    return `${months} months of stock\n${usageText}`;
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatCompetitorTooltip = (item: any) => {
    const competitors = [
      { name: 'Nupharm', price: item.Nupharm },
      { name: 'AAH2', price: item.AAH2 },
      { name: 'ETH LIST', price: item.ETH_LIST },
      { name: 'LEXON2', price: item.LEXON2 }
    ];
    
    const validCompetitors = competitors.filter(comp => comp.price && comp.price > 0);
    
    if (validCompetitors.length === 0) {
      return "No competitor pricing available";
    }
    
    return validCompetitors
      .sort((a, b) => a.price - b.price)
      .map(comp => `${comp.name}: ${formatCurrency(comp.price)}`)
      .join('\n');
  };

  // Summary stats
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    priorityIssues.forEach(issue => {
      counts[issue.severity]++;
    });
    return counts;
  }, [priorityIssues]);

  const totalImpactValue = priorityIssues.reduce((sum, issue) => sum + issue.impactValue, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-red-500/30 bg-red-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{severityCounts.critical}</div>
            <div className="text-sm text-gray-400">Critical Issues</div>
          </CardContent>
        </Card>
        <Card className="border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{severityCounts.high}</div>
            <div className="text-sm text-gray-400">High Priority</div>
          </CardContent>
        </Card>
        <Card className="border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{severityCounts.medium}</div>
            <div className="text-sm text-gray-400">Medium Priority</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(totalImpactValue)}</div>
            <div className="text-sm text-gray-400">Total Impact Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by stock code, description, or issue details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterIssueType} onValueChange={setFilterIssueType}>
              <SelectTrigger className="w-64 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Issue Types</SelectItem>
                <SelectItem value="HIGH_VALUE_OVERSTOCK_FAST_MOVER">High Value Overstock (HVO)</SelectItem>
                <SelectItem value="WATCHLIST_DECLINING_PRICE">Watchlist Declining Price (WDP)</SelectItem>
                <SelectItem value="COMPETITIVE_DISADVANTAGE">Competitive Disadvantage (COMP)</SelectItem>
                <SelectItem value="EXCESSIVE_MONTHS_STOCK">Excessive Months Stock (EMS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredIssues.length} of {priorityIssues.length} priority issues
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                                 <tr className="border-b border-gray-700">
                   <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('severity')}>
                     Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
                   </th>
                   <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockcode')}>
                     Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                   </th>
                   <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('type')}>
                     Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                   </th>
                   <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockValue')}>
                     Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                   </th>
                   <th className="text-right p-3 text-gray-300">Avg Cost</th>
                   <th className="text-center p-3 text-gray-300">Stock Qty</th>
                   <th className="text-center p-3 text-gray-300">Months</th>
                   <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('velocityCategory')}>
                     Velocity {sortField === 'velocityCategory' && (sortDirection === 'asc' ? '↑' : '↓')}
                   </th>
                   <th className="text-center p-3 text-gray-300">Trend</th>
                   <th className="text-center p-3 text-gray-300">Watch</th>
                   <th className="text-right p-3 text-gray-300">Price</th>
                   <th className="text-right p-3 text-gray-300">NBP</th>
                   <th className="text-right p-3 text-gray-300">Lowest Comp</th>
                   <th className="text-right p-3 text-gray-300">SDT</th>
                   <th className="text-right p-3 text-gray-300">EDT</th>
                   <th className="text-center p-3 text-gray-300">Star</th>
                 </tr>
              </thead>
              <tbody>
                                 {filteredIssues.map((issue) => (
                   <tr key={issue.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                     <td className="p-3 text-center">
                       <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${getSeverityColor(issue.severity)}`}>
                         <span>{getSeverityIcon(issue.severity)}</span>
                         <span className="capitalize">{issue.severity}</span>
                       </div>
                     </td>
                     <td className="p-3">
                       <div className="flex flex-col">
                         <span className="text-white font-mono text-sm font-semibold">{issue.item.stockcode}</span>
                         <span className="text-gray-400 text-xs max-w-xs truncate" title={issue.item.description}>
                           {issue.item.description}
                         </span>
                       </div>
                     </td>
                     <td className="p-3 text-center">
                       <TooltipProvider>
                         <UITooltip>
                           <TooltipTrigger asChild>
                             <span className="cursor-help bg-gray-700 px-2 py-1 rounded text-xs font-bold">
                               {getTypeAbbreviation(issue.type)}
                             </span>
                           </TooltipTrigger>
                           <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                             {getTypeDescription(issue.type)}
                           </TooltipContent>
                         </UITooltip>
                       </TooltipProvider>
                     </td>
                     <td className="p-3 text-white text-right font-semibold">
                       {formatCurrency(issue.item.stockValue || 0)}
                     </td>
                     <td className="p-3 text-white text-right font-semibold">
                       {formatCurrency(issue.item.avg_cost || 0)}
                     </td>
                     <td className="p-3 text-center text-gray-300">
                       {(issue.item.stock || issue.item.currentStock || 0).toLocaleString()}
                     </td>
                     <td className="p-3 text-center font-semibold text-orange-400">
                       <TooltipProvider>
                         <UITooltip>
                           <TooltipTrigger asChild>
                             <span className="cursor-help underline decoration-dotted">
                               {(issue.item.monthsOfStock || 0).toFixed(1)}
                             </span>
                           </TooltipTrigger>
                           <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                             <div className="space-y-1">
                               {formatMonthsTooltip(issue.item).split('\n').map((line, idx) => (
                                 <div key={idx} className="text-sm">{line}</div>
                               ))}
                             </div>
                           </TooltipContent>
                         </UITooltip>
                       </TooltipProvider>
                     </td>
                     <td className={`p-3 text-center font-semibold ${getCategoryColor(issue.item.velocityCategory)}`}>
                       {issue.item.velocityCategory || 'N/A'}
                     </td>
                     <td className="p-3 text-center">
                       <span className={`text-lg font-bold ${
                         issue.item.trendDirection === 'UP' ? 'text-red-400' :
                         issue.item.trendDirection === 'DOWN' ? 'text-green-400' :
                         issue.item.trendDirection === 'STABLE' ? 'text-blue-400' :
                         'text-gray-400'
                       }`}>
                         {issue.item.trendDirection === 'UP' ? '↑' :
                          issue.item.trendDirection === 'DOWN' ? '↓' :
                          issue.item.trendDirection === 'STABLE' ? '−' : '?'}
                       </span>
                     </td>
                     <td className="p-3 text-center text-lg">
                       {issue.item.watchlist}
                     </td>
                     <td className="p-3 text-right text-purple-400 font-semibold">
                       {issue.item.AVER ? formatCurrency(issue.item.AVER) : 'N/A'}
                     </td>
                     <td className="p-3 text-right text-green-400 font-semibold">
                       <TooltipProvider>
                         <UITooltip>
                           <TooltipTrigger asChild>
                             <span className="cursor-help underline decoration-dotted">
                               {issue.item.nextBuyingPrice ? formatCurrency(issue.item.nextBuyingPrice) : 
                                (issue.item.nbp ? formatCurrency(issue.item.nbp) : 
                                 (issue.item.next_cost ? formatCurrency(issue.item.next_cost) : 
                                  (issue.item.min_cost ? formatCurrency(issue.item.min_cost) : 
                                   (issue.item.last_po_cost ? formatCurrency(issue.item.last_po_cost) : 'N/A'))))}
                             </span>
                           </TooltipTrigger>
                                                       <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="space-y-1">
                                {issue.item.next_cost && issue.item.next_cost > 0 && (
                                  <div className="text-sm">Next Cost: {formatCurrency(issue.item.next_cost)}</div>
                                )}
                                {issue.item.min_cost && issue.item.min_cost > 0 && (
                                  <div className="text-sm">Min Cost: {formatCurrency(issue.item.min_cost)}</div>
                                )}
                                {issue.item.last_po_cost && issue.item.last_po_cost > 0 && (
                                  <div className="text-sm">Last PO Cost: {formatCurrency(issue.item.last_po_cost)}</div>
                                )}
                                {!issue.item.next_cost && !issue.item.min_cost && !issue.item.last_po_cost && (
                                  <div className="text-sm">No NBP data available</div>
                                )}
                              </div>
                            </TooltipContent>
                         </UITooltip>
                       </TooltipProvider>
                     </td>
                     <td className="p-3 text-right text-blue-400 font-semibold">
                       <TooltipProvider>
                         <UITooltip>
                           <TooltipTrigger asChild>
                             <span className="cursor-help underline decoration-dotted">
                               {issue.item.bestCompetitorPrice ? formatCurrency(issue.item.bestCompetitorPrice) : 
                                (issue.item.lowestMarketPrice ? formatCurrency(issue.item.lowestMarketPrice) : 
                                 (issue.item.Nupharm ? formatCurrency(issue.item.Nupharm) : 
                                  (issue.item.AAH2 ? formatCurrency(issue.item.AAH2) : 
                                   (issue.item.LEXON2 ? formatCurrency(issue.item.LEXON2) : 'N/A'))))}
                             </span>
                           </TooltipTrigger>
                           <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                             <div className="space-y-1">
                               {formatCompetitorTooltip(issue.item).split('\n').map((line, idx) => (
                                 <div key={idx} className="text-sm">{line}</div>
                               ))}
                             </div>
                           </TooltipContent>
                         </UITooltip>
                       </TooltipProvider>
                     </td>
                     <td className="p-3 text-center">
                       <button
                         onClick={() => onToggleStar(issue.item.id)}
                         className={`text-lg hover:scale-110 transition-transform ${
                           starredItems.has(issue.item.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                         }`}
                       >
                         {starredItems.has(issue.item.id) ? '★' : '☆'}
                       </button>
                     </td>
                     <td className="p-3 text-right text-cyan-400 font-semibold">
                       {issue.item.SDT ? formatCurrency(issue.item.SDT) : 'N/A'}
                     </td>
                     <td className="p-3 text-right text-indigo-400 font-semibold">
                       {issue.item.EDT ? formatCurrency(issue.item.EDT) : 'N/A'}
                     </td>
                     <td className="p-3 text-center">
                       <button
                         onClick={() => onToggleStar(issue.item.id)}
                         className={`text-lg hover:scale-110 transition-transform ${
                           starredItems.has(issue.item.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                         }`}
                       >
                         {starredItems.has(issue.item.id) ? '★' : '☆'}
                       </button>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
          {filteredIssues.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No priority issues found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const WatchlistAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get watchlist items
  const watchlistItems = data.analyzedItems.filter(item => item.watchlist === '⚠️');

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = watchlistItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || 
        (filterCategory === 'overstock' && item.monthsOfStock && item.monthsOfStock > 6) ||
        (filterCategory === 'fast-mover' && typeof item.velocityCategory === 'number' && item.velocityCategory <= 3) ||
        (filterCategory === 'high-value' && item.stockValue >= 10000) ||
        (filterCategory === 'declining' && item.trendDirection === 'DOWN');
      
      return matchesSearch && matchesCategory;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'stockcode':
          aValue = a.stockcode;
          bValue = b.stockcode;
          break;
        case 'description':
          aValue = a.description;
          bValue = b.description;
          break;
        case 'stockValue':
          aValue = a.stockValue;
          bValue = b.stockValue;
          break;
        case 'monthsOfStock':
          aValue = a.monthsOfStock || 0;
          bValue = b.monthsOfStock || 0;
          break;
        case 'velocityCategory':
          aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 99;
          bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 99;
          break;
        case 'currentStock':
          aValue = a.currentStock || a.stock || 0;
          bValue = b.currentStock || b.stock || 0;
          break;
        case 'trendDirection':
          const trendOrder = { DOWN: 3, STABLE: 2, UP: 1, 'N/A': 0 };
          aValue = trendOrder[a.trendDirection] || 0;
          bValue = trendOrder[b.trendDirection] || 0;
          break;
        case 'sdt':
          aValue = a.SDT || 0;
          bValue = b.SDT || 0;
          break;
        case 'edt':
          aValue = a.EDT || 0;
          bValue = b.EDT || 0;
          break;
        default:
          aValue = a.stockValue;
          bValue = b.stockValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [watchlistItems, searchTerm, filterCategory, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskLevel = (item: any) => {
    let riskScore = 0;
    
    // High months of stock
    if (item.monthsOfStock && item.monthsOfStock > 12) riskScore += 3;
    else if (item.monthsOfStock && item.monthsOfStock > 6) riskScore += 2;
    
    // Declining trend
    if (item.trendDirection === 'DOWN') riskScore += 2;
    
    // High value at risk
    if (item.stockValue > 20000) riskScore += 2;
    else if (item.stockValue > 10000) riskScore += 1;
    
    // Fast moving but overstock
    if (typeof item.velocityCategory === 'number' && item.velocityCategory <= 3 && item.monthsOfStock > 6) {
      riskScore += 2;
    }
    
    if (riskScore >= 5) return { level: 'High Risk', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (riskScore >= 3) return { level: 'Medium Risk', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    if (riskScore >= 1) return { level: 'Low Risk', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { level: 'Monitor', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  };

  // Calculate total watchlist value
  const totalWatchlistValue = watchlistItems.reduce((sum, item) => sum + (item.stockValue || 0), 0);
  const overstockWatchlistItems = watchlistItems.filter(item => item.monthsOfStock && item.monthsOfStock > 6);
  const decliningWatchlistItems = watchlistItems.filter(item => item.trendDirection === 'DOWN');

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{watchlistItems.length}</div>
            <div className="text-sm text-gray-400">Watchlist Items</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(totalWatchlistValue)}</div>
            <div className="text-sm text-gray-400">Total Value</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{overstockWatchlistItems.length}</div>
            <div className="text-sm text-gray-400">Overstock (&gt;6 months)</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{decliningWatchlistItems.length}</div>
            <div className="text-sm text-gray-400">Declining Trend</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search watchlist items by stock code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="overstock">Overstock (&gt;6 months)</SelectItem>
                <SelectItem value="declining">Declining Trend</SelectItem>
                <SelectItem value="fast-mover">Fast Movers (Cat 1-3)</SelectItem>
                <SelectItem value="high-value">High Value (£10k+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredItems.length} of {watchlistItems.length} watchlist items
          </div>
        </CardContent>
      </Card>

      {/* Watchlist Items Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300">Risk Level</th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300">Avg Cost</th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('velocityCategory')}>
                    Velocity {sortField === 'velocityCategory' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('trendDirection')}>
                    Trend {sortField === 'trendDirection' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300">Price</th>
                  <th className="text-right p-3 text-gray-300">NBP</th>
                  <th className="text-right p-3 text-gray-300">Lowest Comp</th>
                  <th className="text-right p-3 text-gray-300">SDT</th>
                  <th className="text-right p-3 text-gray-300">EDT</th>
                  <th className="text-center p-3 text-gray-300">Star</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const risk = getRiskLevel(item);
                  return (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-white font-mono text-sm font-semibold">{item.stockcode}</span>
                          <span className="text-gray-400 text-xs max-w-xs truncate" title={item.description}>
                            {item.description}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded border ${risk.color}`}>
                          {risk.level}
                        </span>
                      </td>
                      <td className="p-3 text-right text-white font-semibold">
                        {formatCurrency(item.stockValue)}
                      </td>
                      <td className="p-3 text-right text-gray-300">
                        {formatCurrency(item.avg_cost || 0)}
                      </td>
                      <td className="p-3 text-right text-gray-300">
                        {(item.currentStock || item.stock || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-semibold text-orange-400">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                        {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-lg font-bold ${getTrendColor(item.trendDirection)}`}>
                          {item.trendDirection === 'UP' ? '↑' :
                           item.trendDirection === 'DOWN' ? '↓' :
                           item.trendDirection === 'STABLE' ? '−' : '?'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-purple-400 font-semibold">
                        {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                      </td>
                      <td className="p-3 text-right text-green-400 font-semibold">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.nextBuyingPrice ? formatCurrency(item.nextBuyingPrice) : 
                                 (item.nbp ? formatCurrency(item.nbp) : 
                                  (item.next_cost ? formatCurrency(item.next_cost) : 
                                   (item.min_cost ? formatCurrency(item.min_cost) : 
                                    (item.last_po_cost ? formatCurrency(item.last_po_cost) : 'N/A'))))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="space-y-1">
                                {item.next_cost && item.next_cost > 0 && (
                                  <div className="text-sm">Next Cost: {formatCurrency(item.next_cost)}</div>
                                )}
                                {item.min_cost && item.min_cost > 0 && (
                                  <div className="text-sm">Min Cost: {formatCurrency(item.min_cost)}</div>
                                )}
                                {item.last_po_cost && item.last_po_cost > 0 && (
                                  <div className="text-sm">Last PO Cost: {formatCurrency(item.last_po_cost)}</div>
                                )}
                                {!item.next_cost && !item.min_cost && !item.last_po_cost && (
                                  <div className="text-sm">No NBP data available</div>
                                )}
                              </div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-3 text-right text-blue-400 font-semibold">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                                 (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                  (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                   (item.AAH2 ? formatCurrency(item.AAH2) : 
                                    (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                              <div className="space-y-1">
                                {[
                                  { name: 'Nupharm', price: item.Nupharm },
                                  { name: 'AAH2', price: item.AAH2 },
                                  { name: 'ETH LIST', price: item.ETH_LIST },
                                  { name: 'LEXON2', price: item.LEXON2 }
                                ].filter(comp => comp.price && comp.price > 0)
                                 .sort((a, b) => a.price - b.price)
                                 .map((comp, idx) => (
                                  <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                                ))}
                                {![item.Nupharm, item.AAH2, item.ETH_LIST, item.LEXON2].some(price => price && price > 0) && (
                                  <div className="text-sm">No competitor pricing available</div>
                                )}
                              </div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-3 text-right text-cyan-400 font-semibold">
                        {item.SDT ? formatCurrency(item.SDT) : 'N/A'}
                      </td>
                      <td className="p-3 text-right text-indigo-400 font-semibold">
                        {item.EDT ? formatCurrency(item.EDT) : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onToggleStar(item.id)}
                          className={`text-lg hover:scale-110 transition-transform ${
                            starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                          }`}
                        >
                          {starredItems.has(item.id) ? '★' : '☆'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              {watchlistItems.length === 0 
                ? "No items are currently on the watchlist." 
                : "No watchlist items found matching your criteria."}
            </div>
          )}
        </CardContent>
      </Card>

      {watchlistItems.length > 0 && (
        <Card className="border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="text-amber-400 font-semibold">Watchlist Management Tips</h3>
                <ul className="text-gray-300 text-sm mt-2 space-y-1">
                  <li>• <strong>High Risk items</strong> require immediate attention - consider promotional pricing or supplier returns</li>
                  <li>• <strong>Declining trends</strong> may indicate market changes - review pricing strategy</li>
                  <li>• <strong>Fast movers with overstock</strong> suggest purchasing inefficiencies - review order quantities</li>
                  <li>• Regular watchlist review helps maintain healthy inventory turnover</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const StarredItemsAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Get starred items
  const starred = data.analyzedItems.filter(item => starredItems.has(item.id));

  // Filter and sort items
  const filteredStarred = useMemo(() => {
    let filtered = starred.filter(item => {
      return searchTerm === '' || 
        item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'stockcode':
          aValue = a.stockcode;
          bValue = b.stockcode;
          break;
        case 'description':
          aValue = a.description;
          bValue = b.description;
          break;
        case 'stockValue':
          aValue = a.stockValue;
          bValue = b.stockValue;
          break;
        case 'monthsOfStock':
          aValue = a.monthsOfStock || 0;
          bValue = b.monthsOfStock || 0;
          break;
        case 'velocityCategory':
          aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 99;
          bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 99;
          break;
        case 'currentStock':
          aValue = a.currentStock || a.stock || 0;
          bValue = b.currentStock || b.stock || 0;
          break;
        case 'sdt':
          aValue = a.SDT || 0;
          bValue = b.SDT || 0;
          break;
        case 'edt':
          aValue = a.EDT || 0;
          bValue = b.EDT || 0;
          break;
        default:
          aValue = a.stockValue;
          bValue = b.stockValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [starred, searchTerm, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Calculate starred items stats
  const totalStarredValue = starred.reduce((sum, item) => sum + (item.stockValue || 0), 0);
  const starredWatchlistItems = starred.filter(item => item.watchlist === '⚠️');
  const starredOverstockItems = starred.filter(item => item.monthsOfStock && item.monthsOfStock > 6);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{starred.length}</div>
            <div className="text-sm text-gray-400">Starred Items</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(totalStarredValue)}</div>
            <div className="text-sm text-gray-400">Total Value</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{starredWatchlistItems.length}</div>
            <div className="text-sm text-gray-400">Also on Watchlist</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search starred items by stock code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredStarred.length} of {starred.length} starred items
          </div>
        </CardContent>
      </Card>

      {/* Starred Items Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300">Status</th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300">Avg Cost</th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('velocityCategory')}>
                    Velocity {sortField === 'velocityCategory' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300">Trend</th>
                  <th className="text-right p-3 text-gray-300">Price</th>
                  <th className="text-right p-3 text-gray-300">NBP</th>
                  <th className="text-right p-3 text-gray-300">Lowest Comp</th>
                  <th className="text-right p-3 text-gray-300">SDT</th>
                  <th className="text-right p-3 text-gray-300">EDT</th>
                  <th className="text-center p-3 text-gray-300">Unstar</th>
                </tr>
              </thead>
              <tbody>
                {filteredStarred.map((item) => {
                  const isWatchlist = item.watchlist === '⚠️';
                  const isOverstock = item.monthsOfStock && item.monthsOfStock > 6;
                  return (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-white font-mono text-sm font-semibold">{item.stockcode}</span>
                          <span className="text-gray-400 text-xs max-w-xs truncate" title={item.description}>
                            {item.description}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          {isWatchlist && (
                            <span className="px-2 py-1 text-xs rounded border bg-orange-500/20 text-orange-400 border-orange-500/30">
                              Watchlist
                            </span>
                          )}
                          {isOverstock && (
                            <span className="px-2 py-1 text-xs rounded border bg-red-500/20 text-red-400 border-red-500/30">
                              Overstock
                            </span>
                          )}
                          {!isWatchlist && !isOverstock && (
                            <span className="px-2 py-1 text-xs rounded border bg-green-500/20 text-green-400 border-green-500/30">
                              Normal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right text-white font-semibold">
                        {formatCurrency(item.stockValue)}
                      </td>
                      <td className="p-3 text-right text-gray-300">
                        {formatCurrency(item.avg_cost || 0)}
                      </td>
                      <td className="p-3 text-right text-gray-300">
                        {(item.currentStock || item.stock || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-semibold text-orange-400">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                        {typeof item.velocityCategory === 'number' ? `Cat ${item.velocityCategory}` : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-lg font-bold ${getTrendColor(item.trendDirection)}`}>
                          {item.trendDirection === 'UP' ? '↑' :
                           item.trendDirection === 'DOWN' ? '↓' :
                           item.trendDirection === 'STABLE' ? '−' : '?'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-purple-400 font-semibold">
                        {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                      </td>
                      <td className="p-3 text-right text-green-400 font-semibold">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.nextBuyingPrice ? formatCurrency(item.nextBuyingPrice) : 
                                 (item.nbp ? formatCurrency(item.nbp) : 
                                  (item.next_cost ? formatCurrency(item.next_cost) : 
                                   (item.min_cost ? formatCurrency(item.min_cost) : 
                                    (item.last_po_cost ? formatCurrency(item.last_po_cost) : 'N/A'))))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="space-y-1">
                                {item.next_cost && item.next_cost > 0 && (
                                  <div className="text-sm">Next Cost: {formatCurrency(item.next_cost)}</div>
                                )}
                                {item.min_cost && item.min_cost > 0 && (
                                  <div className="text-sm">Min Cost: {formatCurrency(item.min_cost)}</div>
                                )}
                                {item.last_po_cost && item.last_po_cost > 0 && (
                                  <div className="text-sm">Last PO Cost: {formatCurrency(item.last_po_cost)}</div>
                                )}
                                {!item.next_cost && !item.min_cost && !item.last_po_cost && (
                                  <div className="text-sm">No NBP data available</div>
                                )}
                              </div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-3 text-right text-blue-400 font-semibold">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                                 (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                  (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                   (item.AAH2 ? formatCurrency(item.AAH2) : 
                                    (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                              <div className="space-y-1">
                                {[
                                  { name: 'Nupharm', price: item.Nupharm },
                                  { name: 'AAH2', price: item.AAH2 },
                                  { name: 'ETH LIST', price: item.ETH_LIST },
                                  { name: 'LEXON2', price: item.LEXON2 }
                                ].filter(comp => comp.price && comp.price > 0)
                                 .sort((a, b) => a.price - b.price)
                                 .map((comp, idx) => (
                                  <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                                ))}
                                {![item.Nupharm, item.AAH2, item.ETH_LIST, item.LEXON2].some(price => price && price > 0) && (
                                  <div className="text-sm">No competitor pricing available</div>
                                )}
                              </div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-3 text-right text-cyan-400 font-semibold">
                        {item.SDT ? formatCurrency(item.SDT) : 'N/A'}
                      </td>
                      <td className="p-3 text-right text-indigo-400 font-semibold">
                        {item.EDT ? formatCurrency(item.EDT) : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onToggleStar(item.id)}
                          className="text-lg hover:scale-110 transition-transform text-yellow-400 hover:text-gray-400"
                          title="Remove from starred items"
                        >
                          ★
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredStarred.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              {starred.length === 0 
                ? "No items have been starred yet. Star items from other tables to track them here." 
                : "No starred items found matching your search criteria."}
            </div>
          )}
        </CardContent>
      </Card>

      {starred.length > 0 && (
        <Card className="border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="text-yellow-400 font-semibold">Starred Items Overview</h3>
                <div className="text-gray-300 text-sm mt-2 space-y-1">
                  <p>Use starred items to create your personal follow-up list. This helps you:</p>
                  <ul className="ml-4 space-y-1">
                    <li>• Track items requiring special attention across different analysis views</li>
                    <li>• Monitor progress on items you're actively managing</li>
                    <li>• Create a centralized view of your priority inventory items</li>
                    <li>• Export focused reports on items of interest</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Wrapper component
const InventoryAnalytics: React.FC = () => <InventoryAnalyticsContent />;

export default InventoryAnalytics; 