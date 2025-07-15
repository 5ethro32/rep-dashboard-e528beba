import React, { useState, useMemo, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, ITextFilterParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Import the ProcessedInventoryItem type
interface ProcessedInventoryItem {
  id: string;
  stockcode: string;
  description: string;
  currentStock?: number;
  quantity_on_order?: number;
  quantity_ringfenced?: number;
  packs_sold_last_30_days?: number;
  packs_sold_avg_last_six_months?: number;
  packs_sold_reva_last_30_days?: number;
  velocityCategory?: number;
  trendDirection?: string;
  min_supplier?: string;
  min_cost?: number;
  [key: string]: any;
}

interface InventoryHealthTableProps {
  items: ProcessedInventoryItem[];
  onToggleStar: (id: string) => void;
  starredItems: Set<string>;
}

// Enhanced item interface for calculations
interface EnrichedInventoryItem extends ProcessedInventoryItem {
  avgDailyDemand: number;
  safetyStock: number;
  reorderPoint: number;
  daysUntilStockout: number;
  severity: 'CRITICAL' | 'REORDER' | 'MONITOR';
  severityScore: number;
  isFastMover: boolean;
  eqoQty: number;
  leadTimeQty: number;
  suggestedOrderQty: number;
}

const InventoryHealthTable: React.FC<InventoryHealthTableProps> = ({ 
  items, 
  onToggleStar, 
  starredItems 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Calculate inventory metrics for each item
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      // Calculate daily demand using existing data
      const recentDailyDemand = (item.packs_sold_last_30_days || 0) / 30;
      const longTermDailyDemand = (item.packs_sold_avg_last_six_months || 0) / 30;
      
      // Use hybrid approach: recent trend with long-term stability
      const avgDailyDemand = recentDailyDemand > 0 ? 
        (recentDailyDemand * 0.7 + longTermDailyDemand * 0.3) : 
        longTermDailyDemand;

      // REVA usage provides safety stock baseline
      const safetyStock = item.packs_sold_reva_last_30_days || 0;
      
      // Updated to 5-day lead time as requested
      const leadTimeDays = 5;
      const reorderPoint = (avgDailyDemand * leadTimeDays) + safetyStock;
      
      // Calculate current stock position
      const currentStock = item.currentStock || 0;
      
      // Calculate days until stockout
      const daysUntilStockout = avgDailyDemand > 0 ? currentStock / avgDailyDemand : 999;
      
      // Determine severity level with velocity factor
      const isVelocityCategory = typeof item.velocityCategory === 'number';
      const isFastMover = isVelocityCategory && item.velocityCategory <= 3;
      
      let severity: 'CRITICAL' | 'REORDER' | 'MONITOR' = 'MONITOR';
      let severityScore = 0;
      
      if (currentStock <= safetyStock) {
        severity = 'CRITICAL';
        severityScore = isFastMover ? 1 : 2; // Fast movers get higher priority
      } else if (currentStock <= reorderPoint) {
        severity = 'REORDER';
        severityScore = isFastMover ? 3 : 4;
      } else {
        severity = 'MONITOR';
        severityScore = isFastMover ? 5 : 6;
      }
      
      // Calculate suggested order quantities
      // EOQ approximation: sqrt(2 * annual_demand * ordering_cost / holding_cost)
      // Simplified: use 2-3 months of demand as EOQ baseline
      const annualDemand = avgDailyDemand * 365;
      const eqoQty = Math.ceil(Math.sqrt(2 * annualDemand * 50 / 5)); // Rough EOQ
      
      // Lead time + safety buffer approach (updated to 5 days)
      const leadTimeQty = Math.ceil((avgDailyDemand * leadTimeDays) + safetyStock + (avgDailyDemand * 7)); // Extra week buffer
      
      // Use the larger of the two as suggested order
      const suggestedOrderQty = Math.max(eqoQty, leadTimeQty);

      return {
        ...item,
        avgDailyDemand,
        safetyStock,
        reorderPoint,
        daysUntilStockout,
        severity,
        severityScore,
        isFastMover,
        eqoQty,
        leadTimeQty,
        suggestedOrderQty
      } as EnrichedInventoryItem;
    });
  }, [items]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444'; // red-400
      case 'REORDER': return '#facc15'; // yellow-400
      case 'MONITOR': return '#fb923c'; // orange-400
      default: return '#9ca3af'; // gray-400
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP': return '↗️';
      case 'DOWN': return '↘️';
      case 'STABLE': return '➡️';
      default: return '❓';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return '#4ade80'; // green-400
      case 'DOWN': return '#f87171'; // red-400
      case 'STABLE': return '#60a5fa'; // blue-400
      default: return '#9ca3af'; // gray-400
    }
  };

  // Custom cell renderer for Item column (description + stock code)
  const ItemCellRenderer = (params: any) => {
    const stockcode = params.data.stockcode || '';
    const description = params.data.description || '';
    
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
      <div 
        style={{ 
          lineHeight: '1.3',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '6px 4px',
          minHeight: '50px',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ 
          fontWeight: '600', 
          color: '#ffffff',
          fontSize: '13px',
          marginBottom: isHovered ? '3px' : '0px',
          maxWidth: '280px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          transition: 'margin-bottom 0.2s ease'
        }}>
          {description || 'No description available'}
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#9ca3af', 
          opacity: isHovered ? 1 : 0,
          display: 'block',
          height: isHovered ? 'auto' : '0px',
          overflow: 'hidden',
          transition: 'opacity 0.2s ease, height 0.2s ease'
        }}>
          {stockcode}
        </div>
      </div>
    );
  };

  // Custom cell renderer for Severity column
  const SeverityCellRenderer = (params: any) => {
    const severity = params.data.severity;
    const color = getSeverityColor(severity);
    
    return (
      <div style={{
        backgroundColor: `${color}20`,
        color: color,
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        textAlign: 'center',
        display: 'inline-block',
        minWidth: '80px'
      }}>
        {severity}
      </div>
    );
  };

  // Custom cell renderer for Usage Trend column
  const TrendCellRenderer = (params: any) => {
    const trend = params.data.trendDirection;
    const icon = getTrendIcon(trend);
    const color = getTrendColor(trend);
    
    return (
      <div style={{
        color: color,
        fontSize: '16px',
        textAlign: 'center',
        cursor: 'help'
      }} title={`Usage trending ${trend?.toLowerCase() || 'unknown'}`}>
        {icon}
      </div>
    );
  };

  // Custom cell renderer for Safety Stock with tooltip
  const SafetyStockCellRenderer = (params: any) => {
    const safetyStock = params.data.safetyStock;
    const revaUsage = params.data.packs_sold_reva_last_30_days || 0;
    
    return (
      <div style={{
        textAlign: 'right',
        padding: '4px',
        cursor: 'help'
      }} title={`Safety Stock Breakdown:\nREVA Usage (30-day): ${revaUsage} packs\nBased on REVA system usage patterns`}>
        {Math.round(safetyStock)}
      </div>
    );
  };

  // Custom cell renderer for Suggested Order Qty with tooltip
  const SuggestedOrderCellRenderer = (params: any) => {
    const suggestedQty = params.data.suggestedOrderQty;
    const eqoQty = params.data.eqoQty;
    const leadTimeQty = params.data.leadTimeQty;
    
    return (
      <div style={{
        textAlign: 'right',
        padding: '4px',
        color: '#60a5fa',
        fontWeight: '600',
        cursor: 'help',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted'
      }} title={`Order Calculations:\nEOQ: ${Math.round(eqoQty)} packs\nLead Time: ${Math.round(leadTimeQty)} packs\nSuggested: ${Math.round(suggestedQty)} packs`}>
        {Math.round(suggestedQty)}
      </div>
    );
  };

  // Column definitions for AG Grid
  const columnDefs: ColDef[] = [
    {
      headerName: 'Item',
      field: 'stockcode',
      pinned: 'left',
      width: 300,
      cellRenderer: ItemCellRenderer,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Severity',
      field: 'severity',
      width: 120,
      cellRenderer: SeverityCellRenderer,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Current Stock',
      field: 'currentStock',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Days Until Stockout',
      field: 'daysUntilStockout',
      width: 150,
      type: 'numericColumn',
      valueFormatter: (params: any) => params.value >= 999 ? '∞' : Math.round(params.value).toString(),
      cellStyle: (params: any) => {
        const days = params.value;
        if (days <= 7) return { color: '#f87171' }; // red
        if (days <= 14) return { color: '#facc15' }; // yellow
        return { color: '#d1d5db' }; // gray
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Daily Demand',
      field: 'avgDailyDemand',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: any) => params.value.toFixed(1),
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Safety Stock',
      field: 'safetyStock',
      width: 120,
      cellRenderer: SafetyStockCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Reorder Point',
      field: 'reorderPoint',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: any) => Math.round(params.value).toString(),
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Suggested Order Qty',
      field: 'suggestedOrderQty',
      width: 150,
      cellRenderer: SuggestedOrderCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Velocity',
      field: 'velocityCategory',
      width: 100,
      type: 'numericColumn',
      cellStyle: (params: any) => {
        const category = params.value;
        if (typeof category === 'number' && category <= 3) return { color: '#4ade80' }; // green
        if (typeof category === 'number' && category <= 6) return { color: '#facc15' }; // yellow
        return { color: '#f87171' }; // red
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'On Order',
      field: 'quantity_on_order',
      width: 100,
      type: 'numericColumn',
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Usage Trend',
      field: 'trendDirection',
      width: 120,
      cellRenderer: TrendCellRenderer,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Min Supplier',
      field: 'min_supplier',
      width: 150,
      cellStyle: { color: '#4ade80' }, // green
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'NBP Cost',
      field: 'min_cost',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: any) => {
        return params.value && params.value > 0 ? formatCurrency(params.value) : 'N/A';
      },
      cellStyle: { color: '#4ade80', fontWeight: '600' }, // green
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: '⭐',
      field: 'starred',
      width: 60,
      valueGetter: (params: any) => starredItems.has(params.data.id) ? '★' : '☆',
      cellStyle: (params: any) => {
        const isStarred = starredItems.has(params.data.id);
        return {
          color: isStarred ? '#facc15' : '#6b7280',
          textAlign: 'center' as const,
          cursor: 'pointer'
        };
      },
      onCellClicked: (params: any) => {
        onToggleStar(params.data.id);
      },
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressSizeToFit: true
    }
  ];

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  // Apply quick filter when search term changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="p-4">
        <Input
          placeholder="Search by stock code, description, or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <div className="mt-2 text-sm text-gray-400">
          Showing {enrichedItems.length} items requiring attention
        </div>
      </div>

      {/* AG Grid Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {enrichedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          ) : (
            <div 
              className="ag-theme-alpine-dark" 
              style={{ 
                height: '600px', 
                width: '100%'
              }}
            >
              <AgGridReact
                columnDefs={columnDefs}
                rowData={enrichedItems}
                onGridReady={onGridReady}
                components={{
                  itemCellRenderer: ItemCellRenderer,
                  severityCellRenderer: SeverityCellRenderer,
                  trendCellRenderer: TrendCellRenderer,
                  safetyStockCellRenderer: SafetyStockCellRenderer,
                  suggestedOrderCellRenderer: SuggestedOrderCellRenderer
                }}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                  minWidth: 80
                }}
                rowHeight={64}
                headerHeight={56}
                suppressRowClickSelection={true}
                rowSelection="multiple"
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200, 500, 1000]}
                suppressPaginationPanel={false}
                enableRangeSelection={true}
                suppressMenuHide={false}
                animateRows={true}
                suppressCellFocus={true}
                enableCellTextSelection={true}
                tooltipShowDelay={500}
                tooltipHideDelay={10000}
                tooltipMouseTrack={true}
                domLayout="normal"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryHealthTable; 