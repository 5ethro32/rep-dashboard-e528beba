import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  ClientSideRowModelModule,
  ModuleRegistry,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  ValidationModule,
  QuickFilterModule,
  TooltipModule,
  CellStyleModule
} from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  QuickFilterModule,
  TooltipModule,
  CellStyleModule,
  ...(process.env.NODE_ENV !== 'production' ? [ValidationModule] : [])
]);

// Custom CSS for AG Grid Filter Styling
const agGridFilterStyles = `
  /* Clean filter panel layout */
  .ag-theme-alpine-dark .ag-filter-wrapper {
    padding: 16px !important;
    background-color: #111827 !important;
    border-radius: 8px !important;
    border: 1px solid #374151 !important;
  }

  .ag-theme-alpine-dark .ag-filter-body-wrapper {
    background-color: transparent !important;
  }

  /* Remove nested boxes and borders from filter containers */
  .ag-theme-alpine-dark .ag-filter-condition-body,
  .ag-theme-alpine-dark .ag-filter-condition-body-wrapper,
  .ag-theme-alpine-dark .ag-filter-apply-panel {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* MODERN dropdown styling - remove button appearance */
  .ag-theme-alpine-dark .ag-filter-select,
  .ag-theme-alpine-dark select {
    background-color: #374151 !important;
    border: 2px solid #3B82F6 !important;
    border-radius: 8px !important;
    padding: 10px 32px 10px 12px !important;
    color: #F9FAFB !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    outline: none !important;
    appearance: none !important;
    width: 100% !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%233B82F6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
    background-position: right 10px center !important;
    background-repeat: no-repeat !important;
    background-size: 18px !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  }

  /* MODERN input field styling - darker to match dropdown */
  .ag-theme-alpine-dark .ag-input-field-input,
  .ag-theme-alpine-dark .ag-input-field input,
  .ag-theme-alpine-dark input[type="text"] {
    background-color: #374151 !important;
    border: 2px solid #3B82F6 !important;
    border-radius: 8px !important;
    padding: 10px 12px !important;
    color: #F9FAFB !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    outline: none !important;
    width: 100% !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  }

  /* Beautiful DRAMATIC blue glow on focus/click - only for input */
  .ag-theme-alpine-dark .ag-input-field-input:focus,
  .ag-theme-alpine-dark .ag-input-field input:focus,
  .ag-theme-alpine-dark input[type="text"]:focus {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4) !important;
    background-color: #1F2937 !important;
    transform: scale(1.02) !important;
  }

  /* Subtle focus for dropdown */
  .ag-theme-alpine-dark .ag-filter-select:focus,
  .ag-theme-alpine-dark select:focus {
    border-color: #4B5563 !important;
    background-color: #1F2937 !important;
  }

  /* Hover effects */
  .ag-theme-alpine-dark .ag-filter-select:hover,
  .ag-theme-alpine-dark .ag-input-field-input:hover,
  .ag-theme-alpine-dark .ag-input-field input:hover,
  .ag-theme-alpine-dark input[type="text"]:hover,
  .ag-theme-alpine-dark select:hover {
    border-color: #4B5563 !important;
    background-color: #1F2937 !important;
  }

  /* Placeholder styling - more visible */
  .ag-theme-alpine-dark .ag-input-field-input::placeholder,
  .ag-theme-alpine-dark .ag-input-field input::placeholder,
  .ag-theme-alpine-dark input[type="text"]::placeholder {
    color: #D1D5DB !important;
    font-weight: 500 !important;
  }

  /* Remove default input field wrapper borders and fix black bits */
  .ag-theme-alpine-dark .ag-input-field {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Remove any extra wrapper styling */
  .ag-theme-alpine-dark .ag-input-wrapper,
  .ag-theme-alpine-dark .ag-picker-field-wrapper,
  .ag-theme-alpine-dark .ag-wrapper {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Remove left/right decorations that cause black bits */
  .ag-theme-alpine-dark .ag-input-field::before,
  .ag-theme-alpine-dark .ag-input-field::after,
  .ag-theme-alpine-dark .ag-picker-field::before,
  .ag-theme-alpine-dark .ag-picker-field::after {
    display: none !important;
  }

  /* Fix filter layout - remove gaps and nested styling */
  .ag-theme-alpine-dark .ag-filter-condition {
    margin-bottom: 8px !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }

  .ag-theme-alpine-dark .ag-filter-condition:last-child {
    margin-bottom: 0 !important;
  }

  /* Ensure condition operators and values don't have nested boxes */
  .ag-theme-alpine-dark .ag-filter-condition-operator-wrapper,
  .ag-theme-alpine-dark .ag-filter-condition-value-wrapper {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Clean condition panel */
  .ag-theme-alpine-dark .ag-filter-condition-panel-description {
    color: #D1D5DB !important;
    font-size: 13px !important;
    margin-bottom: 8px !important;
  }

  /* Ensure proper spacing and alignment - target specific elements */
  .ag-theme-alpine-dark .ag-filter .ag-filter-condition .ag-filter-condition-operator,
  .ag-theme-alpine-dark .ag-filter .ag-filter-condition .ag-filter-condition-value {
    width: 100% !important;
    margin-bottom: 8px !important;
  }

  /* Override any inherited AG Grid input styling */
  .ag-theme-alpine-dark .ag-picker-field-display {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }

  /* Fix any remaining black borders/backgrounds */
  .ag-theme-alpine-dark .ag-picker-field,
  .ag-theme-alpine-dark .ag-picker {
    background: transparent !important;
    border: none !important;
  }

  /* Beautiful AND/OR Radio Button Styling */
  .ag-theme-alpine-dark .ag-filter-condition-operator {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 16px !important;
    padding: 12px 0 !important;
    margin: 8px 0 !important;
  }

  .ag-theme-alpine-dark .ag-radio-button-wrapper {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 8px 12px !important;
    border-radius: 6px !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
  }

  .ag-theme-alpine-dark .ag-radio-button-wrapper:hover {
    background-color: #374151 !important;
  }

  .ag-theme-alpine-dark .ag-radio-button-input-wrapper {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .ag-theme-alpine-dark .ag-radio-button-input {
    appearance: none !important;
    width: 18px !important;
    height: 18px !important;
    border: 2px solid #6B7280 !important;
    border-radius: 50% !important;
    background-color: #374151 !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
  }

  .ag-theme-alpine-dark .ag-radio-button-input:checked {
    border-color: #3B82F6 !important;
    background-color: #3B82F6 !important;
  }

  .ag-theme-alpine-dark .ag-radio-button-input:checked::after {
    content: '' !important;
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background-color: white !important;
  }

  .ag-theme-alpine-dark .ag-radio-button-label {
    color: #F9FAFB !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
  }

  /* Make filter input darker to match the beautiful design */
  .ag-theme-alpine-dark .ag-input-field-input,
  .ag-theme-alpine-dark .ag-input-field input,
  .ag-theme-alpine-dark input[type="text"] {
    background-color: #1F2937 !important;
    border: 2px solid #3B82F6 !important;
    border-radius: 8px !important;
    padding: 10px 12px !important;
    color: #F9FAFB !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    outline: none !important;
    width: 100% !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  }


`;

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
  PoundSterling, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Download,
  Info,
  Star,
  Clock,
  Flag,
  TrendingDown,
  Filter,
  RotateCcw
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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';

// Add imports for dropdown components at the top
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// AG Grid imports - enhanced with proper filter modules
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridApi, 
  GridOptions,
  IDateFilterParams,
  INumberFilterParams,
  ITextFilterParams
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Helper functions for average cost display logic
// Use calculated next average cost (Column J) when meaningful, otherwise use avg_cost
// Column J contains blended average cost when new stock is on order at different prices
const getDisplayedAverageCost = (item: ProcessedInventoryItem): number | null => {
  // Use calculated_next_avg_cost (Column J) if it has a meaningful value (>0), otherwise use avg_cost (Column G)
  if ((item as any).calculated_next_avg_cost && (item as any).calculated_next_avg_cost > 0) {
    return (item as any).calculated_next_avg_cost;
  }
  return item.avg_cost || null;
};

const shouldShowAverageCostTooltip = (item: ProcessedInventoryItem): boolean => {
  // Show tooltip when using calculated_next_avg_cost (Column J) instead of avg_cost (Column G)
  return !!(item as any).calculated_next_avg_cost && (item as any).calculated_next_avg_cost > 0 && item.avg_cost && item.avg_cost > 0;
};

const getAverageCostTooltip = (item: ProcessedInventoryItem): string => {
  // Show original avg_cost (Column G) when displaying calculated_next_avg_cost (Column J)
  if (item.avg_cost && item.avg_cost > 0) {
    return `Original Avg Cost: ${new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(item.avg_cost)}`;
  }
  return '';
};

// AAH price trend tooltip helper functions
const shouldShowAAHTrendTooltip = (item: ProcessedInventoryItem): boolean => {
  // Show tooltip if we have AAH trend data with valid current and yesterday prices
  return !!(item.aahTrend && 
           item.aahTrend.current && 
           item.aahTrend.current > 0 &&
           item.aahTrend.yesterday && 
           item.aahTrend.yesterday > 0 &&
           item.aahTrend.trend !== 'UNKNOWN' &&
           item.aahTrend.trend !== 'NEW');
};

const getAAHTrendTooltip = (item: ProcessedInventoryItem): string => {
  if (!item.aahTrend) return '';
  
  const trend = item.aahTrend;
  if (trend.trend === 'UNKNOWN') return '';

  let trendSymbol = '';
  
  if (trend.trend === 'UP') {
    trendSymbol = '📈'; // chart increasing (green)
  } else if (trend.trend === 'DOWN') {
    trendSymbol = '📉'; // chart decreasing (red)
  } else {
    trendSymbol = '➖'; // minus for stable
  }
  
  if (trend.percentageChange === null || trend.percentageChange === undefined) {
    return `${trendSymbol} 0%`;
  }
  
  const changeSign = trend.changeAmount && trend.changeAmount > 0 ? '+' : '';
  return `${trendSymbol} ${changeSign}${Math.round(trend.percentageChange)}%`;
};

// Helper function to check if Nupharm trend tooltip should be shown
const shouldShowNupharmTrendTooltip = (item: ProcessedInventoryItem): boolean => {
  return !!(item.nupharmTrend && 
           item.nupharmTrend.current && 
           item.nupharmTrend.current > 0 &&
           item.nupharmTrend.yesterday && 
           item.nupharmTrend.yesterday > 0 &&
           item.nupharmTrend.trend !== 'UNKNOWN' &&
           item.nupharmTrend.trend !== 'NEW');
};

// Helper function to format Nupharm trend tooltip
const getNupharmTrendTooltip = (item: ProcessedInventoryItem): string => {
  if (!item.nupharmTrend) return '';
  
  const trend = item.nupharmTrend;
  if (trend.trend === 'UNKNOWN') return '';

  let trendSymbol = '';
  
  if (trend.trend === 'UP') {
    trendSymbol = '📈'; // chart increasing (green)
  } else if (trend.trend === 'DOWN') {
    trendSymbol = '📉'; // chart decreasing (red)
  } else {
    trendSymbol = '➖'; // minus for stable
  }
  
  if (trend.percentageChange === null || trend.percentageChange === undefined) {
    return `${trendSymbol} 0%`;
  }
  
  const changeSign = trend.changeAmount && trend.changeAmount > 0 ? '+' : '';
  return `${trendSymbol} ${changeSign}${Math.round(trend.percentageChange)}%`;
};

// Helper function to check if ETH NET trend tooltip should be shown
const shouldShowETHNetTrendTooltip = (item: ProcessedInventoryItem): boolean => {
  return !!(item.ethNetTrend && 
           item.ethNetTrend.current && 
           item.ethNetTrend.current > 0 &&
           item.ethNetTrend.yesterday && 
           item.ethNetTrend.yesterday > 0 &&
           item.ethNetTrend.trend !== 'UNKNOWN' &&
           item.ethNetTrend.trend !== 'NEW');
};

// Helper function to format ETH NET trend tooltip
const getETHNetTrendTooltip = (item: ProcessedInventoryItem): string => {
  if (!item.ethNetTrend) return '';
  
  const trend = item.ethNetTrend;
  if (trend.trend === 'UNKNOWN') return '';

  let trendSymbol = '';
  
  if (trend.trend === 'UP') {
    trendSymbol = '📈'; // chart increasing (green)
  } else if (trend.trend === 'DOWN') {
    trendSymbol = '📉'; // chart decreasing (red)
  } else {
    trendSymbol = '➖'; // minus for stable
  }
  
  if (trend.percentageChange === null || trend.percentageChange === undefined) {
    return `${trendSymbol} 0%`;
  }
  
  const changeSign = trend.changeAmount && trend.changeAmount > 0 ? '+' : '';
  return `${trendSymbol} ${changeSign}${Math.round(trend.percentageChange)}%`;
};

// Helper function to check if LEXON trend tooltip should be shown
const shouldShowLexonTrendTooltip = (item: ProcessedInventoryItem): boolean => {
  return !!(item.lexonTrend && 
           item.lexonTrend.current && 
           item.lexonTrend.current > 0 &&
           item.lexonTrend.yesterday && 
           item.lexonTrend.yesterday > 0 &&
           item.lexonTrend.trend !== 'UNKNOWN' &&
           item.lexonTrend.trend !== 'NEW');
};

// Helper function to format LEXON trend tooltip
const getLexonTrendTooltip = (item: ProcessedInventoryItem): string => {
  if (!item.lexonTrend) return '';
  
  const trend = item.lexonTrend;
  if (trend.trend === 'UNKNOWN') return '';

  let trendSymbol = '';
  
  if (trend.trend === 'UP') {
    trendSymbol = '📈'; // chart increasing (green)
  } else if (trend.trend === 'DOWN') {
    trendSymbol = '📉'; // chart decreasing (red)
  } else {
    trendSymbol = '➖'; // minus for stable
  }
  
  if (trend.percentageChange === null || trend.percentageChange === undefined) {
    return `${trendSymbol} 0%`;
  }
  
  const changeSign = trend.changeAmount && trend.changeAmount > 0 ? '+' : '';
  return `${trendSymbol} ${changeSign}${Math.round(trend.percentageChange)}%`;
};

// Competitor Price Movement Analysis Helper Functions
const calculateCompetitorPriceMovement = (current: number | null | undefined, yesterday: number | null | undefined): number | null => {
  if (!current || !yesterday || current <= 0 || yesterday <= 0) return null;
  return ((current - yesterday) / yesterday) * 100;
};

const getCompetitorMovements = (item: ProcessedInventoryItem): {
  phx: number | null;
  aah: number | null; 
  eth: number | null;
  lex: number | null;
  average: number | null;
  maxAbsolute: number | null;
  hasMovement: boolean;
} => {
  const phxMovement = calculateCompetitorPriceMovement(item.Nupharm, item.Nupharm_yesterday);
  const aahMovement = calculateCompetitorPriceMovement(item.AAH2, item.AAH_yesterday);
  const ethMovement = calculateCompetitorPriceMovement(item.ETH_NET, item.ETH_NET_yesterday);
  const lexMovement = calculateCompetitorPriceMovement(item.LEXON2, item.LEXON2_yesterday);
  
  const validMovements = [phxMovement, aahMovement, ethMovement, lexMovement].filter(m => m !== null) as number[];
  
  const average = validMovements.length > 0 ? validMovements.reduce((sum, m) => sum + m, 0) / validMovements.length : null;
  const maxAbsolute = validMovements.length > 0 ? validMovements.reduce((max, m) => Math.abs(m) > Math.abs(max) ? m : max, validMovements[0]) : null;
  const hasMovement = validMovements.some(m => Math.abs(m) > 0.1); // At least 0.1% movement
  
  return {
    phx: phxMovement,
    aah: aahMovement,
    eth: ethMovement,
    lex: lexMovement,
    average,
    maxAbsolute,
    hasMovement
  };
};

const formatMovementDisplay = (movement: number | null): string => {
  if (movement === null) return 'N/A';
  const sign = movement > 0 ? '+' : '';
  return `${sign}${movement.toFixed(1)}%`;
};

const getMovementColor = (movement: number | null): string => {
  if (movement === null) return '#9ca3af'; // gray
  if (Math.abs(movement) < 0.5) return '#facc15'; // yellow for stable
  return movement > 0 ? '#4ade80' : '#f87171'; // green for up, red for down
};

// Calculate market trend based on competitor price movements from yesterday
const getMarketTrend = (item: ProcessedInventoryItem | null | undefined): { direction: 'UP' | 'DOWN' | 'STABLE' | 'MIXED' | 'N/A', percentage: number } => {
  // Handle null/undefined item
  if (!item) {
    return { direction: 'N/A', percentage: 0 };
  }

  const competitors = [
    { name: 'PHX', current: item.Nupharm, yesterday: item.Nupharm_yesterday },
    { name: 'AAH', current: item.AAH2, yesterday: item.AAH_yesterday },
    { name: 'ETHN', current: item.ETH_NET, yesterday: item.ETH_NET_yesterday },
    { name: 'LEX', current: item.LEXON2, yesterday: item.LEXON2_yesterday }
  ];

  // Filter to only include competitors with both current and yesterday data
  const validCompetitors = competitors.filter(comp => 
    comp.current && comp.current > 0 && comp.yesterday && comp.yesterday > 0
  );

  if (validCompetitors.length === 0) {
    return { direction: 'N/A', percentage: 0 };
  }

  // Calculate percentage changes for each competitor
  const changes = validCompetitors.map(comp => {
    const change = ((comp.current - comp.yesterday) / comp.yesterday) * 100;
    return {
      name: comp.name,
      change: change,
      direction: change > 0.5 ? 'UP' : change < -0.5 ? 'DOWN' : 'STABLE'
    };
  });

  // Count directions
  const upCount = changes.filter(c => c.direction === 'UP').length;
  const downCount = changes.filter(c => c.direction === 'DOWN').length;
  const stableCount = changes.filter(c => c.direction === 'STABLE').length;

  // Calculate weighted average change
  const avgChange = changes.reduce((sum, c) => sum + c.change, 0) / changes.length;

  // Determine overall direction
  let direction: 'UP' | 'DOWN' | 'STABLE' | 'MIXED' | 'N/A';
  if (upCount > downCount && upCount > stableCount) {
    direction = 'UP';
  } else if (downCount > upCount && downCount > stableCount) {
    direction = 'DOWN';
  } else if (stableCount >= upCount && stableCount >= downCount) {
    direction = 'STABLE';
  } else {
    direction = 'MIXED';
  }

  return { direction, percentage: avgChange };
};

const getMarketTrendDisplay = (item: ProcessedInventoryItem | null | undefined): string => {
  const trend = getMarketTrend(item);
  switch (trend.direction) {
    case 'UP': return '↗️';
    case 'DOWN': return '↘️';
    case 'STABLE': return '→';
    case 'MIXED': return '↕️';
    default: return '?';
  }
};

const getMarketTrendColor = (item: ProcessedInventoryItem | null | undefined): string => {
  const trend = getMarketTrend(item);
  switch (trend.direction) {
    case 'UP': return '#4ade80';
    case 'DOWN': return '#f87171';
    case 'STABLE': return '#facc15';
    case 'MIXED': return '#a78bfa';
    default: return '#9ca3af';
  }
};

const getMarketTrendTooltip = (item: ProcessedInventoryItem | null | undefined): string => {
  // Handle null/undefined item
  if (!item) {
    return 'No data available';
  }

  const competitors = [
    { name: 'PHX', current: item.Nupharm, yesterday: item.Nupharm_yesterday },
    { name: 'AAH', current: item.AAH2, yesterday: item.AAH_yesterday },
    { name: 'ETHN', current: item.ETH_NET, yesterday: item.ETH_NET_yesterday },
    { name: 'LEX', current: item.LEXON2, yesterday: item.LEXON2_yesterday }
  ];

  const validCompetitors = competitors.filter(comp => 
    comp.current && comp.current > 0 && comp.yesterday && comp.yesterday > 0
  );

  if (validCompetitors.length === 0) {
    return 'No competitor trend data available';
  }

  const changes = validCompetitors.map(comp => {
    const change = ((comp.current - comp.yesterday) / comp.yesterday) * 100;
    const direction = change > 0.5 ? '↗️' : change < -0.5 ? '↘️' : '→';
    return `${comp.name}: ${direction} ${change.toFixed(1)}%`;
  });

  const trend = getMarketTrend(item);
  const summary = `Market Trend: ${trend.direction} (avg: ${trend.percentage.toFixed(1)}%)`;
  
  return [summary, ...changes].join('\n');
};

// Helper function to determine winning status: Y (strict win), N (losing), - (tie)
const getWinningStatus = (item: ProcessedInventoryItem | null | undefined): 'Y' | 'N' | '-' => {
  // Handle null/undefined item
  if (!item) return 'N';
  
  if (!item.AVER || item.AVER <= 0) return 'N';
  
  // Get all competitor prices
  const competitorPrices = [
    item.Nupharm,
    item.AAH2, 
    item.ETH_LIST,
    item.ETH_NET,
    item.LEXON2
  ].filter(price => price && price > 0);
  
  if (competitorPrices.length === 0) return '-'; // No competitor data
  
  const lowestCompetitorPrice = Math.min(...competitorPrices);
  
  if (item.AVER < lowestCompetitorPrice) return 'Y'; // We win strictly
  if (item.AVER === lowestCompetitorPrice) return '-'; // Tie
  return 'N'; // We lose
};

// Sticky Horizontal Scroll Table Component
const StickyHorizontalScrollTable: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const stickyScrollRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    const updateTableWidth = () => {
      if (tableRef.current) {
        const table = tableRef.current.querySelector('table');
        if (table) {
          setTableWidth(table.scrollWidth);
        }
      }
    };

    updateTableWidth();
    window.addEventListener('resize', updateTableWidth);
    
    return () => window.removeEventListener('resize', updateTableWidth);
  }, [children]);

  useEffect(() => {
    const tableEl = tableRef.current;
    const stickyEl = stickyScrollRef.current;
    
    if (!tableEl || !stickyEl) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      return () => {
        target.scrollLeft = source.scrollLeft;
      };
    };

    const tableScrollHandler = syncScroll(tableEl, stickyEl);
    const stickyScrollHandler = syncScroll(stickyEl, tableEl);

    tableEl.addEventListener('scroll', tableScrollHandler);
    stickyEl.addEventListener('scroll', stickyScrollHandler);

    return () => {
      tableEl.removeEventListener('scroll', tableScrollHandler);
      stickyEl.removeEventListener('scroll', stickyScrollHandler);
    };
  }, []);

  return (
    <div className={`table-container ${className}`}>
      <div className="table-scroll-wrapper">
        <div ref={tableRef} className="overflow-x-auto table-scroll">
          {children}
        </div>
        <div ref={stickyScrollRef} className="sticky-horizontal-scroll">
          <div 
            className="sticky-scroll-content" 
            style={{ width: `${tableWidth}px` }}
          />
        </div>
      </div>
    </div>
  );
};

// Enhanced Table Component with Scroll Indicators
const TableWithScrollIndicator: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (tableRef.current) {
        const { scrollWidth, clientWidth } = tableRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => window.removeEventListener('resize', checkScrollable);
  }, [children]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!tableRef.current) return;
    
    const scrollAmount = 100;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        tableRef.current.scrollLeft -= scrollAmount;
        break;
      case 'ArrowRight':
        e.preventDefault();
        tableRef.current.scrollLeft += scrollAmount;
        break;
      case 'Home':
        e.preventDefault();
        tableRef.current.scrollLeft = 0;
        break;
      case 'End':
        e.preventDefault();
        tableRef.current.scrollLeft = tableRef.current.scrollWidth;
        break;
    }
  };

  return (
    <div className={`table-container ${className}`} data-scrollable={isScrollable}>
      <div 
        ref={tableRef}
        className="overflow-x-auto table-scroll"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Data table - Use arrow keys to scroll horizontally"
      >
        {children}
      </div>
    </div>
  );
};

// Floating Scrollbar Component
const FloatingScrollbar: React.FC<{
  tableRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
}> = ({ tableRef, isVisible }) => {
  const floatingRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    const updateTableWidth = () => {
      if (tableRef.current) {
        const table = tableRef.current.querySelector('table');
        if (table) {
          setTableWidth(table.scrollWidth);
        }
      }
    };

    updateTableWidth();
    window.addEventListener('resize', updateTableWidth);
    
    return () => window.removeEventListener('resize', updateTableWidth);
  }, [tableRef]);

  useEffect(() => {
    const tableEl = tableRef.current;
    const floatingEl = floatingRef.current;
    
    if (!tableEl || !floatingEl) return;

    const syncFromTable = () => {
      floatingEl.scrollLeft = tableEl.scrollLeft;
    };

    const syncFromFloating = () => {
      tableEl.scrollLeft = floatingEl.scrollLeft;
    };

    tableEl.addEventListener('scroll', syncFromTable);
    floatingEl.addEventListener('scroll', syncFromFloating);

    return () => {
      tableEl.removeEventListener('scroll', syncFromTable);
      floatingEl.removeEventListener('scroll', syncFromFloating);
    };
  }, [tableRef]);

  if (!isVisible) return null;

  return (
    <div ref={floatingRef} className="floating-scrollbar">
      <div 
        className="floating-scrollbar-content" 
        style={{ width: `${tableWidth}px` }}
      />
    </div>
  );
};

// Enhanced Table Component with Floating Scrollbar
const TableWithFloatingScrollbar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (tableRef.current) {
        const { scrollWidth, clientWidth } = tableRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => window.removeEventListener('resize', checkScrollable);
  }, [children]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!tableRef.current) return;
    
    const scrollAmount = 100;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        tableRef.current.scrollLeft -= scrollAmount;
        break;
      case 'ArrowRight':
        e.preventDefault();
        tableRef.current.scrollLeft += scrollAmount;
        break;
      case 'Home':
        e.preventDefault();
        tableRef.current.scrollLeft = 0;
        break;
      case 'End':
        e.preventDefault();
        tableRef.current.scrollLeft = tableRef.current.scrollWidth;
        break;
    }
  };

  return (
    <>
      <div className={`table-container ${className}`} data-scrollable={isScrollable}>
        <div 
          ref={tableRef}
          className="overflow-x-auto table-scroll"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Data table - Use arrow keys to scroll horizontally"
        >
          {children}
        </div>
      </div>
      <FloatingScrollbar tableRef={tableRef} isVisible={isScrollable} />
    </>
  );
};

// Move all analysis components before InventoryAnalyticsContent

// Priority Issues AG Grid Component
const PriorityIssuesAGGrid: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Inject custom AG Grid filter styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-priority-issues-filters', 'true');
    styleElement.textContent = agGridFilterStyles;
    document.head.appendChild(styleElement);

    // Force immediate application
    setTimeout(() => {
      if (gridApi) {
        gridApi.refreshHeader();
      }
    }, 100);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, [gridApi]);

  // Format currency function  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f87171'; // red
      case 'high': return '#fb923c'; // orange
      case 'medium': return '#facc15'; // yellow
      case 'low': return '#60a5fa'; // blue
      default: return '#9ca3af'; // gray
    }
  };

  // Column definitions for AG Grid (includes Issue Type and Severity plus all AllItems columns)
  const columnDefs: ColDef[] = [
    {
      headerName: 'Issue Type',
      field: 'type',
      pinned: 'left',
      width: 150,
      valueFormatter: (params: any) => params.value || 'N/A',
      cellStyle: {
        textAlign: 'center !important' as const,
        color: '#c084fc', // purple-400
        fontWeight: 'bold'
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        suppressAndOrCondition: true
      } as ITextFilterParams,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Severity',
      field: 'severity',
      pinned: 'left', 
      width: 100,
      valueFormatter: (params: any) => {
        const severity = params.value || 'N/A';
        return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
      },
      cellStyle: (params: any) => {
        const severity = params.value || '';
        return {
          textAlign: 'center !important' as const,
          color: getSeverityColor(severity),
          fontWeight: 'bold'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        suppressAndOrCondition: true
      } as ITextFilterParams,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Watch',
      field: 'watchlist',
      pinned: 'left',
      width: 80,
      valueGetter: (params: any) => params.data.item?.watchlist || '−',
      valueFormatter: (params: any) => params.value || '−',
      cellClass: 'text-center',
      cellStyle: (params: any) => {
        const watchlist = params.value || '';
        const hasWarning = watchlist.includes('⚠️') || watchlist.includes('❗');
        return {
          textAlign: 'center !important' as const,
          color: hasWarning ? '#fb923c' : '#6b7280',
          fontSize: '16px'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        suppressAndOrCondition: true
      } as ITextFilterParams,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Item',
      field: 'stockcode',
      pinned: 'left',
      width: 300,
      valueGetter: (params: any) => params.data.item?.stockcode || '',
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        suppressAndOrCondition: true
      } as ITextFilterParams,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Group',
      field: 'velocityCategory',
      width: 90,
      cellClass: 'text-center',
      valueGetter: (params: any) => params.data.item?.velocityCategory,
      valueFormatter: (params: any) => {
        const category = params.value;
        return typeof category === 'number' ? category.toString() : 'N/A';
      },
      cellStyle: (params: any) => {
        const category = params.value;
        let color = '#9ca3af';
        if (typeof category === 'number') {
          if (category <= 2) color = '#4ade80';
          else if (category <= 4) color = '#facc15';
          else color = '#f87171';
        }
        return {
          textAlign: 'center !important' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      filterParams: {
        defaultOption: 'equals',
        suppressAndOrCondition: true
      } as INumberFilterParams,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock £',
      field: 'stockValue',
      width: 110,
      valueGetter: (params: any) => params.data.item?.stockValue || 0,
      valueFormatter: (params: any) => {
        const value = params.value || 0;
        return formatCurrency(value);
      },
      cellClass: 'text-left text-white',
      sortable: true,
      filter: 'agNumberColumnFilter',
      filterParams: {
        defaultOption: 'greaterThan',
        suppressAndOrCondition: true
      } as INumberFilterParams,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock Qty',
      field: 'currentStock',
      width: 110,
      valueGetter: (params: any) => params.data.item?.currentStock || params.data.item?.stock || 0,
      valueFormatter: (params: any) => params.value.toLocaleString(),
      tooltipValueGetter: (params: any) => {
        const ringfenced = params.data.item?.quantity_ringfenced || 0;
        return `RF: ${ringfenced.toLocaleString()}`;
      },
      cellStyle: (params: any) => {
        const currentStock = params.value || 0;
        const ringfenced = params.data.item?.quantity_ringfenced || 0;
        const ringfencedPercent = currentStock > 0 ? Math.min((ringfenced / currentStock) * 100, 100) : 0;
        
        let backgroundImage = 'none';
        if (ringfencedPercent > 0) {
          let fillColor = '#fbbf24';
          if (ringfencedPercent >= 25 && ringfencedPercent < 50) fillColor = '#f97316';
          else if (ringfencedPercent >= 50 && ringfencedPercent < 75) fillColor = '#dc2626';
          else if (ringfencedPercent >= 75) fillColor = '#991b1b';
          backgroundImage = `linear-gradient(to top, ${fillColor}15 0%, ${fillColor}15 ${ringfencedPercent}%, transparent ${ringfencedPercent}%, transparent 100%)`;
        }
        
        return {
          textAlign: 'left' as const,
          color: '#d1d5db',
          backgroundImage: backgroundImage,
          paddingLeft: '8px'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Usage',
      field: 'averageUsage',
      width: 100,
      valueGetter: (params: any) => {
        const item = params.data.item;
        return item?.averageUsage || item?.packs_sold_avg_last_six_months;
      },
      valueFormatter: (params: any) => {
        const usage = params.value;
        return usage ? `${usage.toFixed(0)}` : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        const last30Days = item?.packs_sold_last_30_days;
        const revaLast30Days = item?.packs_sold_reva_last_30_days;
        
        let tooltip = '';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `Last 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          if (tooltip) tooltip += '\n';
          tooltip += `Reva Usage: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip || 'No recent usage data available';
      },
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Months',
      field: 'monthsOfStock',
      width: 90,
      valueGetter: (params: any) => params.data.item?.monthsOfStock,
      valueFormatter: (params: any) => {
        const months = params.value;
        return months === 999.9 ? '∞' : months ? months.toFixed(1) : 'N/A';
      },
      cellStyle: (params: any) => {
        const months = params.value;
        return {
          textAlign: 'left' as const,
          fontWeight: months && months > 6 ? 'bold' : 'normal',
          color: months && months > 6 ? '#f87171' : '#d1d5db'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'On Order',
      field: 'quantity_on_order',
      width: 110,
      valueGetter: (params: any) => params.data.item?.quantity_on_order || 0,
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Avg Cost',
      field: 'avg_cost',
      width: 110,
      valueGetter: (params: any) => getDisplayedAverageCost(params.data.item),
      valueFormatter: (params: any) => {
        const value = params.value;
        return value ? formatCurrency(value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        return shouldShowAverageCostTooltip(params.data.item) ? getAverageCostTooltip(params.data.item) : null;
      },
      cellClass: 'text-left text-gray-300 font-bold',
      sortable: true,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'NBP',
      field: 'min_cost',
      width: 110,
      valueGetter: (params: any) => params.data.item?.min_cost,
      valueFormatter: (params: any) => {
        const minCost = params.value;
        return minCost && minCost > 0 ? formatCurrency(minCost) : 'OOS';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        const nextCost = item?.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A';
        const minCost = item?.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A';
        const lastPoCost = item?.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A';
        return `Next Cost: ${nextCost}\nMin Cost: ${minCost}\nLast PO Cost: ${lastPoCost}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#3b82f6', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Buying Trend',
      field: 'trendDirection',
      width: 110,
      valueGetter: (params: any) => params.data.item?.trendDirection,
      valueFormatter: (params: any) => {
        const trend = params.value;
        return trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : trend === 'STABLE' ? '−' : '?';
      },
      cellStyle: (params: any) => {
        const trend = params.value;
        let color = '#9ca3af';
        switch (trend) {
          case 'UP': color = '#4ade80'; break;
          case 'DOWN': color = '#f87171'; break;
          case 'STABLE': color = '#facc15'; break;
        }
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Price',
      field: 'AVER',
      width: 110,
      valueGetter: (params: any) => params.data.item?.AVER,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : 'N/A',
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        const mclean = item?.MCLEAN && item.MCLEAN > 0 ? formatCurrency(item.MCLEAN) : 'N/A';
        const apple = item?.APPLE && item.APPLE > 0 ? formatCurrency(item.APPLE) : 'N/A';
        const davidson = item?.DAVIDSON && item.DAVIDSON > 0 ? formatCurrency(item.DAVIDSON) : 'N/A';
        const reva = item?.reva && item.reva > 0 ? formatCurrency(item.reva) : 'N/A';
        return `MCLEAN: ${mclean}\nAPPLE: ${apple}\nDAVIDSON: ${davidson}\nREVA: ${reva}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#c084fc', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market',
      field: 'lowestComp',
      width: 110,
      valueGetter: (params: any) => {
        const item = params.data.item;
        return item?.bestCompetitorPrice || item?.lowestMarketPrice || item?.Nupharm || item?.AAH2 || item?.LEXON2 || 0;
      },
      valueFormatter: (params: any) => {
        return params.value > 0 ? formatCurrency(params.value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        const competitors = [
          { name: 'PHX', price: item?.Nupharm },
          { name: 'AAH', price: item?.AAH2 },
          { name: 'ETHN', price: item?.ETH_NET },
          { name: 'LEX', price: item?.LEXON2 }
        ].filter(comp => comp.price && comp.price > 0)
         .sort((a, b) => a.price - b.price);
        
        if (competitors.length === 0) {
          return 'No competitor pricing available';
        }
        
        // Build tooltip with competitor prices and trend information
        let tooltipLines = competitors.map(comp => {
          let line = `${comp.name}: ${formatCurrency(comp.price)}`;
          
          // Add trend information for each competitor if available
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'PHX' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'ETHN' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'LEX' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          }
          
          return line;
        });
        
        return tooltipLines.join('\n');
      },
      cellStyle: { textAlign: 'left' as const, color: '#60a5fa', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market Trend',
      field: 'marketTrend',
      width: 110,
      valueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendDisplay(item);
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendTooltip(item);
      },
      cellStyle: (params: any) => {
        const item = params.data.item;
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: getMarketTrendColor(item)
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
{
      headerName: 'Winning',
      field: 'winning',
      width: 90,
      valueGetter: (params: any) => {
        const item = params.data.item;
        const lowestComp = item?.bestCompetitorPrice || item?.lowestMarketPrice || item?.Nupharm || item?.AAH2 || item?.LEXON2;
        const isWinning = item?.AVER && lowestComp && item.AVER < lowestComp;
        return isWinning ? 'Y' : 'N';
      },
      cellStyle: (params: any) => {
        return {
          textAlign: 'center !important' as const,
          fontWeight: 'bold',
          color: params.value === 'Y' ? '#4ade80' : '#f87171'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Margin',
      field: 'margin',
      width: 110,
      valueGetter: (params: any) => calculateMargin(params.data.item),
      valueFormatter: (params: any) => formatMargin(params.value),
      cellStyle: (params: any) => {
        const margin = params.value;
        let color = '#9ca3af';
        if (margin !== null) {
          if (margin < 0) color = '#f87171';
          else if (margin < 10) color = '#fb923c';
          else if (margin < 20) color = '#facc15';
          else color = '#4ade80';
        }
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'SDT',
      field: 'SDT',
      width: 90,
      valueGetter: (params: any) => params.data.item?.SDT,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'EDT',
      field: 'EDT',
      width: 90,
      valueGetter: (params: any) => params.data.item?.EDT,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Star',
      field: 'starred',
      width: 60,
      valueGetter: (params: any) => starredItems.has(params.data.item?.id) ? '★' : '☆',
      cellStyle: (params: any) => {
        const isStarred = starredItems.has(params.data.item?.id);
        return {
          color: isStarred ? '#facc15' : '#6b7280',
          textAlign: 'center !important' as const,
          cursor: 'pointer'
        };
      },
      onCellClicked: (params: any) => {
        onToggleStar(params.data.item?.id);
      },
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressSizeToFit: true
    }
  ];

  // Apply quick filter when search term changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  // Custom cell renderer component for Item column
  const ItemCellRenderer = (params: any) => {
    if (!params.data?.item) return null;
    const stockcode = params.data.item.stockcode || '';
    const description = params.data.item.description || params.data.item.Description || '';
    
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-400">🎯 Priority Issues Analysis - NEW MODERN FILTERS</h3>
        <div className="text-sm text-gray-400">
          {data.priorityIssues.length.toLocaleString()} priority issues
        </div>
      </div>

      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code, description, or issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {data.priorityIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No priority issues found</div>
              <div className="text-sm mt-1">All items are performing well</div>
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
                key="priority-issues-updated-filters-v2"
                columnDefs={columnDefs}
                rowData={data.priorityIssues}
                onGridReady={onGridReady}
                components={{
                  itemCellRenderer: ItemCellRenderer
                }}
                defaultColDef={{
                  flex: 1,
                  minWidth: 150,
                  resizable: true,
                  sortable: true,
                  filter: 'agTextColumnFilter',
                  filterParams: {
                    defaultOption: 'contains',
                    suppressAndOrCondition: true
                  } as ITextFilterParams,
                  suppressHeaderMenuButton: true,
                  suppressHeaderContextMenu: true
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

// Implement the missing components with sticky headers and column filters
const PriorityIssuesAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('impactValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    type: string[];
    severity: string[];
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
    nbp: string[];
    stockQty: string[];
  }>({
    type: [],
    severity: [],
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: [],
    stockQty: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    type: string;
    severity: string;
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
    stockQty: string;
  }>({
    type: '',
    severity: '',
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: '',
    stockQty: ''
  });

  // Filter and sort priority issues
  const filteredIssues = useMemo(() => {
    return data.priorityIssues
      .filter(issue => {
        const matchesSearch = 
          issue.item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesTypeFilter = columnFilters.type.length === 0 || 
          columnFilters.type.includes(issue.type);
        
        const matchesSeverityFilter = columnFilters.severity.length === 0 || 
          columnFilters.severity.includes(issue.severity);
        
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof issue.item.velocityCategory === 'number' ? issue.item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(issue.item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(getWinningStatus(issue.item));

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes(issue.item.min_cost && issue.item.min_cost > 0 ? 'Available' : 'N/A');

        const matchesStockQtyFilter = columnFilters.stockQty.length === 0 || 
          columnFilters.stockQty.includes((issue.item.currentStock || 0) > 0 ? 'In Stock' : 'OOS');

        return matchesSearch && matchesTypeFilter && matchesSeverityFilter && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter && matchesStockQtyFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'impactValue':
            aValue = a.impactValue; bValue = b.impactValue; break;
          case 'severity':
            aValue = a.severity; bValue = b.severity; break;
          case 'type':
            aValue = a.type; bValue = b.type; break;
          case 'stockcode':
            aValue = a.item.stockcode; bValue = b.item.stockcode; break;
          case 'stockValue':
            aValue = a.item.stockValue; bValue = b.item.stockValue; break;
          case 'averageCost':
            aValue = a.item.avg_cost || 0; bValue = b.item.avg_cost || 0; break;
          case 'currentStock':
            aValue = a.item.currentStock; bValue = b.item.currentStock; break;
          case 'onOrder':
            aValue = a.item.quantity_on_order || 0; bValue = b.item.quantity_on_order || 0; break;
          case 'monthsOfStock':
            aValue = a.item.monthsOfStock; bValue = b.item.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.item.velocityCategory === 'number' ? a.item.velocityCategory : 999;
            bValue = typeof b.item.velocityCategory === 'number' ? b.item.velocityCategory : 999;
            break;
          case 'trendDirection':
            // Custom sorting for trend: DOWN > STABLE > UP > N/A
            const trendOrder = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
            aValue = trendOrder[a.item.trendDirection as keyof typeof trendOrder] || 4;
            bValue = trendOrder[b.item.trendDirection as keyof typeof trendOrder] || 4;
            break;
                      case 'nbp':
              aValue = a.item.nextBuyingPrice || a.item.nbp || a.item.next_cost || a.item.min_cost || a.item.last_po_cost || 0;
              bValue = b.item.nextBuyingPrice || b.item.nbp || b.item.next_cost || b.item.min_cost || b.item.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.item.bestCompetitorPrice || a.item.lowestMarketPrice || a.item.Nupharm || a.item.AAH2 || a.item.LEXON2;
            const bLowestComp = b.item.bestCompetitorPrice || b.item.lowestMarketPrice || b.item.Nupharm || b.item.AAH2 || b.item.LEXON2;
            aValue = (a.item.AVER && aLowestComp && a.item.AVER < aLowestComp) ? 1 : 0;
                          bValue = (b.item.AVER && bLowestComp && b.item.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.item.bestCompetitorPrice || a.item.lowestMarketPrice || a.item.Nupharm || a.item.AAH2 || a.item.LEXON2 || 0;
            bValue = b.item.bestCompetitorPrice || b.item.lowestMarketPrice || b.item.Nupharm || b.item.AAH2 || b.item.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.item.AVER || 0; bValue = b.item.AVER || 0; break;
          case 'margin':
            // Calculate gross margin percentage: ((price - cost) / price) * 100
            aValue = (a.item.AVER && a.item.avg_cost && a.item.AVER > 0) ? ((a.item.AVER - a.item.avg_cost) / a.item.AVER) * 100 : -999;
            bValue = (b.item.AVER && b.item.avg_cost && b.item.AVER > 0) ? ((b.item.AVER - b.item.avg_cost) / b.item.AVER) * 100 : -999;
            break;
          case 'sdt':
            aValue = a.item.SDT || 0; bValue = b.item.SDT || 0; break;
          case 'edt':
            aValue = a.item.EDT || 0; bValue = b.item.EDT || 0; break;
          default:
            aValue = a.item.stockcode; bValue = b.item.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.priorityIssues, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    switch (category) {
      case 1: return 'text-green-400';
      case 2: return 'text-blue-400';
      case 3: return 'text-yellow-400';
      case 4: return 'text-orange-400';
      case 5: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueTypes = () => {
    const types = [...new Set(data.priorityIssues.map(issue => issue.type))];
    return types.sort();
  };

  const getUniqueSeverities = () => {
    const severities = [...new Set(data.priorityIssues.map(issue => issue.severity))];
    return severities.sort((a, b) => {
      const order = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
      return (order[a as keyof typeof order] || 5) - (order[b as keyof typeof order] || 5);
    });
  };

  const getUniqueVelocityCategories = () => {
    // Get velocity categories from all analyzed items for comprehensive filter options
    const categories = [...new Set(data.analyzedItems.map(item => 
      typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A'
    ))];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    // Get trend directions from all analyzed items for comprehensive filter options
    const trends = [...new Set(data.analyzedItems.map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
  };

  const getUniqueStockQtyValues = () => {
    return ['In Stock', 'OOS'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative text-sm`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {filteredIssues.length} issues found
        </div>
      </div>

      {/* Issue Type Key */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-white mb-2">Issue Type Key:</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <div><span className="font-medium">Out of Stock:</span> No available inventory</div>
            <div><span className="font-medium">Overstock:</span> Excessive inventory levels</div>
            <div><span className="font-medium">Cost Disadvantage:</span> Higher costs than competitors</div>
            <div><span className="font-medium">Margin Opportunity:</span> Potential for increased margins</div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code, description, or issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Issue Type', 'type', 'type', getUniqueTypes())}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {renderColumnHeader('Severity', 'severity', 'severity', getUniqueSeverities(), 'center')}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                          <div className="text-sm">Issue priority level: Critical &gt; High &gt; Medium &gt; Low</div>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('impactValue')}>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <button className="cursor-pointer hover:text-white" onClick={() => handleSort('impactValue')}>
                            Impact Value {sortField === 'impactValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                          <div className="text-sm">Financial impact of the issue (stock value at risk or opportunity value)</div>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    <span className="font-bold">Avg Cost</span> {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Stock Qty', 'currentStock', 'stockQty', getUniqueStockQtyValues(), 'left')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort("monthsOfStock")}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('margin')}>
                    Margin {sortField === 'margin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'left')}
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{issue.item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{issue.item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-300 text-sm">
                      {issue.type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={`font-semibold ${getSeverityColor(issue.severity)} capitalize`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="p-3 text-left text-red-400 font-semibold text-sm">
                      {formatCurrency(issue.impactValue)}
                    </td>
                    <td className="p-3 text-left text-gray-300 font-bold text-sm">
                      {shouldShowAverageCostTooltip(issue.item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(issue.item) ? formatCurrency(getDisplayedAverageCost(issue.item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(issue.item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(issue.item) ? formatCurrency(getDisplayedAverageCost(issue.item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              {(issue.item.currentStock || 0).toLocaleString()}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">
                              Ringfenced: {(issue.item.quantity_ringfenced || 0).toLocaleString()}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {(issue.item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-left text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${issue.item.monthsOfStock && issue.item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                              {issue.item.monthsOfStock === 999.9 ? '∞' : issue.item.monthsOfStock ? issue.item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{issue.item.averageUsage || issue.item.packs_sold_avg_last_six_months ? (issue.item.averageUsage || issue.item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(issue.item.velocityCategory)}`}>
                      {typeof issue.item.velocityCategory === 'number' ? issue.item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(issue.item.trendDirection)}`}>
                      {issue.item.trendDirection === 'UP' ? '↑' : 
                       issue.item.trendDirection === 'DOWN' ? '↓' : 
                       issue.item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={issue.item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {issue.item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-left text-purple-400 font-semibold text-sm">
                      {issue.item.AVER ? formatCurrency(issue.item.AVER) : 'N/A'}
                    </td>
                    <td className={`p-3 text-left font-semibold text-sm ${getMarginColor(calculateMargin(issue.item))}`}>
                      {formatMargin(calculateMargin(issue.item))}
                    </td>
                    <td className="p-3 text-left text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {issue.item.min_cost && issue.item.min_cost > 0 ? formatCurrency(issue.item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {issue.item.next_cost && issue.item.next_cost > 0 ? formatCurrency(issue.item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {issue.item.min_cost && issue.item.min_cost > 0 ? formatCurrency(issue.item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {issue.item.last_po_cost && issue.item.last_po_cost > 0 ? formatCurrency(issue.item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      <span className={
                        getWinningStatus(issue.item) === 'Y' ? 'text-green-400' : 
                        getWinningStatus(issue.item) === 'N' ? 'text-red-400' :
                        'text-gray-400'
                      }>
                        {getWinningStatus(issue.item)}
                      </span>
                    </td>
                    <td className="p-3 text-left text-blue-400 font-semibold text-sm">
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
                              {[
                                { name: 'Nupharm', price: issue.item.Nupharm },
                                { name: 'AAH2', price: issue.item.AAH2 },
                                { name: 'ETH_LIST', price: issue.item.ETH_LIST },
                                { name: 'ETH_NET', price: issue.item.ETH_NET },
                                { name: 'LEXON2', price: issue.item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">
                                  {comp.name}: {formatCurrency(comp.price)}
                                  {comp.name === 'AAH2' && shouldShowAAHTrendTooltip(issue.item) && (
                                    <div className="text-xs text-gray-300 mt-1 pl-2 border-l border-gray-600">
                                      {getAAHTrendTooltip(issue.item).split('\n').map((line, lineIdx) => (
                                        <div key={lineIdx}>{line}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {![issue.item.Nupharm, issue.item.AAH2, issue.item.ETH_LIST, issue.item.ETH_NET, issue.item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {issue.item.SDT ? formatCurrency(issue.item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {issue.item.EDT ? formatCurrency(issue.item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(issue.item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(issue.item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(issue.item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredIssues.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No priority issues found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Watchlist AG Grid Component
const WatchlistAGGrid: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Format currency function  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Column definitions for AG Grid - matches the metric filtered view table
  const columnDefs: ColDef[] = [
    {
      headerName: 'Watch',
      field: 'watchlist',
      pinned: 'left',
      width: 80,
      valueFormatter: (params: any) => params.value || '−',
      cellClass: 'text-center',
      cellStyle: (params: any) => {
        const watchlist = params.value || '';
        const hasWarning = watchlist.includes('⚠️') || watchlist.includes('❗');
        return {
          textAlign: 'center !important' as const,
          color: hasWarning ? '#fb923c' : '#6b7280',
          fontSize: '16px'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Item',
      field: 'stockcode',
      pinned: 'left',
      width: 300,
      valueGetter: (params: any) => params.data.stockcode,
      cellRenderer: 'itemCellRenderer',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Group',
      field: 'velocityCategory',
      width: 90,
      valueFormatter: (params: any) => {
        const category = params.value;
        return typeof category === 'number' ? category.toString() : 'N/A';
      },
      cellStyle: (params: any) => {
        const category = params.value;
        let color = '#9ca3af';
        if (typeof category === 'number') {
          if (category <= 2) color = '#4ade80';
          else if (category <= 4) color = '#facc15';
          else color = '#f87171';
        }
        return {
          textAlign: 'center !important' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock £',
      field: 'stockValue',
      width: 110,
      valueFormatter: (params: any) => {
        const value = params.value || 0;
        return formatCurrency(value);
      },
      cellClass: 'text-left text-white',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock Qty',
      field: 'currentStock',
      width: 110,
      valueGetter: (params: any) => params.data.currentStock || params.data.stock || 0,
      valueFormatter: (params: any) => params.value.toLocaleString(),
      tooltipValueGetter: (params: any) => {
        const ringfenced = params.data.quantity_ringfenced || 0;
        return `RF: ${ringfenced.toLocaleString()}`;
      },
      cellStyle: (params: any) => {
        const currentStock = params.value || 0;
        const ringfenced = params.data.quantity_ringfenced || 0;
        const ringfencedPercent = currentStock > 0 ? Math.min((ringfenced / currentStock) * 100, 100) : 0;
        
        let backgroundImage = 'none';
        if (ringfencedPercent > 0) {
          let fillColor = '#fbbf24';
          if (ringfencedPercent >= 25 && ringfencedPercent < 50) fillColor = '#f97316';
          else if (ringfencedPercent >= 50 && ringfencedPercent < 75) fillColor = '#dc2626';
          else if (ringfencedPercent >= 75) fillColor = '#991b1b';
          backgroundImage = `linear-gradient(to top, ${fillColor}15 0%, ${fillColor}15 ${ringfencedPercent}%, transparent ${ringfencedPercent}%, transparent 100%)`;
        }
        
        return {
          textAlign: 'left' as const,
          color: '#d1d5db',
          backgroundImage: backgroundImage,
          paddingLeft: '8px'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Usage',
      field: 'averageUsage',
      width: 100,
      valueGetter: (params: any) => {
        const item = params.data;
        return item?.averageUsage || item?.packs_sold_avg_last_six_months;
      },
      valueFormatter: (params: any) => {
        const usage = params.value;
        return usage ? `${usage.toFixed(0)}` : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const last30Days = item?.packs_sold_last_30_days;
        const revaLast30Days = item?.packs_sold_reva_last_30_days;
        
        let tooltip = '';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `Last 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          if (tooltip) tooltip += '\n';
          tooltip += `Reva Usage: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip || 'No recent usage data available';
      },
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Months',
      field: 'monthsOfStock',
      width: 90,
      valueFormatter: (params: any) => {
        const months = params.value;
        return months === 999.9 ? '∞' : months ? months.toFixed(1) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const usage = params.data.averageUsage || params.data.packs_sold_avg_last_six_months;
        const last30Days = params.data.packs_sold_last_30_days;
        const revaLast30Days = params.data.packs_sold_reva_last_30_days;
        
        let tooltip = usage ? `${usage.toFixed(0)} packs/month (6mo avg)` : 'No usage data (6mo avg)';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `\nLast 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          tooltip += `\nReva last 30 days: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip;
      },
      cellStyle: (params: any) => {
        const months = params.value;
        return {
          textAlign: 'left' as const,
          fontWeight: months && months > 6 ? 'bold' : 'normal',
          color: months && months > 6 ? '#f87171' : '#d1d5db'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'On Order',
      field: 'quantity_on_order',
      width: 110,
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Avg Cost',
      field: 'avg_cost',
      width: 110,
      valueGetter: (params: any) => getDisplayedAverageCost(params.data),
      valueFormatter: (params: any) => {
        const value = params.value;
        return value ? formatCurrency(value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        return shouldShowAverageCostTooltip(params.data) ? getAverageCostTooltip(params.data) : null;
      },
      cellClass: 'text-left text-gray-300 font-bold',
      sortable: true,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'NBP',
      field: 'min_cost',
      width: 110,
      valueFormatter: (params: any) => {
        const minCost = params.value;
        return minCost && minCost > 0 ? formatCurrency(minCost) : 'OOS';
      },
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const nextCost = data.next_cost && data.next_cost > 0 ? formatCurrency(data.next_cost) : 'N/A';
        const minCost = data.min_cost && data.min_cost > 0 ? formatCurrency(data.min_cost) : 'N/A';
        const lastPoCost = data.last_po_cost && data.last_po_cost > 0 ? formatCurrency(data.last_po_cost) : 'N/A';
        return `Next Cost: ${nextCost}\nMin Cost: ${minCost}\nLast PO Cost: ${lastPoCost}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#3b82f6', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Buying Trend',
      field: 'trendDirection',
      width: 110,
      valueFormatter: (params: any) => {
        const trend = params.value;
        return trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : trend === 'STABLE' ? '−' : '?';
      },
      cellStyle: (params: any) => {
        const trend = params.value;
        let color = '#9ca3af';
        switch (trend) {
          case 'UP': color = '#4ade80'; break;
          case 'DOWN': color = '#f87171'; break;
          case 'STABLE': color = '#facc15'; break;
        }
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Price',
      field: 'AVER',
      width: 110,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : 'N/A',
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const mclean = data.MCLEAN && data.MCLEAN > 0 ? formatCurrency(data.MCLEAN) : 'N/A';
        const apple = data.APPLE && data.APPLE > 0 ? formatCurrency(data.APPLE) : 'N/A';
        const davidson = data.DAVIDSON && data.DAVIDSON > 0 ? formatCurrency(data.DAVIDSON) : 'N/A';
        const reva = data.reva && data.reva > 0 ? formatCurrency(data.reva) : 'N/A';
        return `MCLEAN: ${mclean}\nAPPLE: ${apple}\nDAVIDSON: ${davidson}\nREVA: ${reva}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#c084fc', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market',
      field: 'lowestComp',
      width: 110,
      valueGetter: (params: any) => {
        return params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2 || 0;
      },
      valueFormatter: (params: any) => {
        return params.value > 0 ? formatCurrency(params.value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const competitors = [
          { name: 'PHX', price: item.Nupharm },
          { name: 'AAH', price: item.AAH2 },
          { name: 'ETHN', price: item.ETH_NET },
          { name: 'LEX', price: item.LEXON2 }
        ].filter(comp => comp.price && comp.price > 0)
         .sort((a, b) => a.price - b.price);
        
        if (competitors.length === 0) {
          return 'No competitor pricing available';
        }
        
        // Build tooltip with competitor prices and trend information
        let tooltipLines = competitors.map(comp => {
          let line = `${comp.name}: ${formatCurrency(comp.price)}`;
          
          // Add trend information for each competitor if available
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'PHX' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'ETHN' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'LEX' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          }
          
          return line;
        });
        
        return tooltipLines.join('\n');
      },
      cellStyle: { textAlign: 'left' as const, color: '#60a5fa', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market Trend',
      field: 'marketTrend',
      width: 110,
      valueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendDisplay(item);
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendTooltip(item);
      },
      cellStyle: (params: any) => {
        const item = params.data.item;
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: getMarketTrendColor(item)
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
{
      headerName: 'Winning',
      field: 'winning',
      width: 90,
      valueGetter: (params: any) => {
        const lowestComp = params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2;
        const isWinning = params.data.AVER && lowestComp && params.data.AVER < lowestComp;
        return isWinning ? 'Y' : 'N';
      },
      cellStyle: (params: any) => {
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: params.value === 'Y' ? '#4ade80' : '#f87171'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Margin',
      field: 'margin',
      width: 110,
      valueGetter: (params: any) => calculateMargin(params.data),
      valueFormatter: (params: any) => formatMargin(params.value),
      cellStyle: (params: any) => {
        const margin = params.value;
        let color = '#9ca3af';
        if (margin !== null) {
          if (margin < 0) color = '#f87171';
          else if (margin < 10) color = '#fb923c';
          else if (margin < 20) color = '#facc15';
          else color = '#4ade80';
        }
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'SDT',
      field: 'SDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'EDT',
      field: 'EDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Star',
      field: 'starred',
      width: 60,
      valueGetter: (params: any) => starredItems.has(params.data.id) ? '★' : '☆',
      cellStyle: (params: any) => {
        const isStarred = starredItems.has(params.data.id);
        return {
          color: isStarred ? '#facc15' : '#6b7280',
          textAlign: 'center !important' as const,
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

  // Filter to show only watchlist items
  const watchlistItems = useMemo(() => {
    return data.analyzedItems.filter(item => item.watchlist === '⚠️');
  }, [data.analyzedItems]);

  // Apply quick filter when search term changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  // Custom cell renderer component for Item column
  const ItemCellRenderer = (params: any) => {
    if (!params.data) return null;
    const stockcode = params.data.stockcode || '';
    const description = params.data.description || params.data.Description || '';
    
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Watchlist Analysis</h3>
        <div className="text-sm text-gray-400">
          {watchlistItems.length.toLocaleString()} watchlist items
        </div>
      </div>

      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {watchlistItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No watchlist items found</div>
              <div className="text-sm mt-1">Items will appear here when flagged for attention</div>
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
                rowData={watchlistItems}
                onGridReady={onGridReady}
                components={{
                  itemCellRenderer: ItemCellRenderer
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

const WatchlistAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
    nbp: string[];
    stockQty: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: [],
    stockQty: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
    stockQty: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: '',
    stockQty: ''
  });

  // Filter watchlist items
  const watchlistItems = useMemo(() => {
    return data.analyzedItems
      .filter(item => item.watchlist === '⚠️')
      .filter(item => {
        const matchesSearch = 
          item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(getWinningStatus(item));

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes(item.min_cost && item.min_cost > 0 ? 'Available' : 'N/A');

        const matchesStockQtyFilter = columnFilters.stockQty.length === 0 || 
          columnFilters.stockQty.includes((item.currentStock || 0) > 0 ? 'In Stock' : 'OOS');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter && matchesStockQtyFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'stockValue':
            aValue = a.stockValue; bValue = b.stockValue; break;
          case 'averageCost':
            aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
          case 'monthsOfStock':
            aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
            bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
            break;
          case 'currentStock':
            aValue = a.currentStock; bValue = b.currentStock; break;
          case 'onOrder':
            aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
          case 'nbp':
            aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
            bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
            const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
            aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
            bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
            bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.AVER || 0; bValue = b.AVER || 0; break;
          case 'sdt':
            aValue = a.SDT || 0; bValue = b.SDT || 0; break;
          case 'edt':
            aValue = a.EDT || 0; bValue = b.EDT || 0; break;
          default:
            aValue = a.stockcode; bValue = b.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.analyzedItems, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getUniqueVelocityCategories = () => {
    // Get velocity categories from all analyzed items for comprehensive filter options
    const categories = [...new Set(data.analyzedItems
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    // Get trend directions from all analyzed items for comprehensive filter options
    const trends = [...new Set(data.analyzedItems
      .map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
  };

  const getUniqueStockQtyValues = () => {
    return ['In Stock', 'OOS'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative text-sm`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Watchlist Analysis</h3>
        <div className="text-sm text-gray-400">
          {watchlistItems.length} watchlist items
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    <span className="font-bold">Avg Cost</span> {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Stock Qty', 'currentStock', 'stockQty', getUniqueStockQtyValues(), 'left')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort("monthsOfStock")}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('margin')}>
                    Margin {sortField === 'margin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'left')}
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {watchlistItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-left text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              {(item.currentStock || 0).toLocaleString()}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">
                              Ringfenced: {(item.quantity_ringfenced || 0).toLocaleString()}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-left text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
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
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(item.trendDirection)}`}>
                      {item.trendDirection === 'UP' ? '↑' : 
                       item.trendDirection === 'DOWN' ? '↓' : 
                       item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-left text-purple-400 font-bold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className={`p-3 text-left font-semibold text-sm ${getMarginColor(calculateMargin(item))}`}>
                      {formatMargin(calculateMargin(item))}
                    </td>
                    <td className="p-3 text-left text-green-400 font-bold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-left text-blue-400 font-semibold text-sm">
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
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {watchlistItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No watchlist items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Starred Items AG Grid Component
const StarredItemsAGGrid: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Format currency function  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Column definitions for AG Grid (same as AllItemsAGGrid)
  const columnDefs: ColDef[] = [
    {
      headerName: 'Watch',
      field: 'watchlist',
      pinned: 'left',
      width: 80,
      valueFormatter: (params: any) => params.value || '−',
      cellClass: 'text-center',
      cellStyle: (params: any) => {
        const watchlist = params.value || '';
        const hasWarning = watchlist.includes('⚠️') || watchlist.includes('❗');
        return {
          textAlign: 'center !important' as const,
          color: hasWarning ? '#fb923c' : '#6b7280',
          fontSize: '16px'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Item',
      field: 'stockcode',
      pinned: 'left',
      width: 300,
      valueGetter: (params: any) => params.data.stockcode,
      cellRenderer: 'itemCellRenderer',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Group',
      field: 'velocityCategory',
      width: 90,
      valueFormatter: (params: any) => {
        const category = params.value;
        return typeof category === 'number' ? category.toString() : 'N/A';
      },
      cellStyle: (params: any) => {
        const category = params.value;
        let color = '#9ca3af';
        if (typeof category === 'number') {
          if (category <= 2) color = '#4ade80';
          else if (category <= 4) color = '#facc15';
          else color = '#f87171';
        }
        return {
          textAlign: 'center !important' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock £',
      field: 'stockValue',
      width: 110,
      valueFormatter: (params: any) => {
        const value = params.value || 0;
        return formatCurrency(value);
      },
      cellClass: 'text-left text-white',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock Qty',
      field: 'currentStock',
      width: 110,
      valueGetter: (params: any) => params.data.currentStock || params.data.stock || 0,
      valueFormatter: (params: any) => params.value.toLocaleString(),
      tooltipValueGetter: (params: any) => {
        const ringfenced = params.data.quantity_ringfenced || 0;
        return `RF: ${ringfenced.toLocaleString()}`;
      },
      cellStyle: (params: any) => {
        const currentStock = params.value || 0;
        const ringfenced = params.data.quantity_ringfenced || 0;
        const ringfencedPercent = currentStock > 0 ? Math.min((ringfenced / currentStock) * 100, 100) : 0;
        
        let backgroundImage = 'none';
        if (ringfencedPercent > 0) {
          let fillColor = '#fbbf24';
          if (ringfencedPercent >= 25 && ringfencedPercent < 50) fillColor = '#f97316';
          else if (ringfencedPercent >= 50 && ringfencedPercent < 75) fillColor = '#dc2626';
          else if (ringfencedPercent >= 75) fillColor = '#991b1b';
          backgroundImage = `linear-gradient(to top, ${fillColor}15 0%, ${fillColor}15 ${ringfencedPercent}%, transparent ${ringfencedPercent}%, transparent 100%)`;
        }
        
        return {
          textAlign: 'left' as const,
          color: '#d1d5db',
          backgroundImage: backgroundImage,
          paddingLeft: '8px'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Usage',
      field: 'averageUsage',
      width: 100,
      valueGetter: (params: any) => {
        const item = params.data;
        return item?.averageUsage || item?.packs_sold_avg_last_six_months;
      },
      valueFormatter: (params: any) => {
        const usage = params.value;
        return usage ? `${usage.toFixed(0)}` : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const last30Days = item?.packs_sold_last_30_days;
        const revaLast30Days = item?.packs_sold_reva_last_30_days;
        
        let tooltip = '';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `Last 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          if (tooltip) tooltip += '\n';
          tooltip += `Reva Usage: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip || 'No recent usage data available';
      },
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Months',
      field: 'monthsOfStock',
      width: 90,
      valueFormatter: (params: any) => {
        const months = params.value;
        return months === 999.9 ? '∞' : months ? months.toFixed(1) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const usage = params.data.averageUsage || params.data.packs_sold_avg_last_six_months;
        const last30Days = params.data.packs_sold_last_30_days;
        const revaLast30Days = params.data.packs_sold_reva_last_30_days;
        
        let tooltip = usage ? `${usage.toFixed(0)} packs/month (6mo avg)` : 'No usage data (6mo avg)';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `\nLast 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          tooltip += `\nReva last 30 days: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip;
      },
      cellStyle: (params: any) => {
        const months = params.value;
        return {
          textAlign: 'left' as const,
          fontWeight: months && months > 6 ? 'bold' : 'normal',
          color: months && months > 6 ? '#f87171' : '#d1d5db'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'On Order',
      field: 'quantity_on_order',
      width: 110,
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Avg Cost',
      field: 'avg_cost',
      width: 110,
      valueGetter: (params: any) => getDisplayedAverageCost(params.data),
      valueFormatter: (params: any) => {
        const value = params.value;
        return value ? formatCurrency(value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        return shouldShowAverageCostTooltip(params.data) ? getAverageCostTooltip(params.data) : null;
      },
      cellClass: 'text-left text-gray-300 font-bold',
      sortable: true,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'NBP',
      field: 'min_cost',
      width: 110,
      valueFormatter: (params: any) => {
        const minCost = params.value;
        return minCost && minCost > 0 ? formatCurrency(minCost) : 'OOS';
      },
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const nextCost = data.next_cost && data.next_cost > 0 ? formatCurrency(data.next_cost) : 'N/A';
        const minCost = data.min_cost && data.min_cost > 0 ? formatCurrency(data.min_cost) : 'N/A';
        const lastPoCost = data.last_po_cost && data.last_po_cost > 0 ? formatCurrency(data.last_po_cost) : 'N/A';
        return `Next Cost: ${nextCost}\nMin Cost: ${minCost}\nLast PO Cost: ${lastPoCost}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#3b82f6', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Buying Trend',
      field: 'trendDirection',
      width: 110,
      valueFormatter: (params: any) => {
        const trend = params.value;
        return trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : trend === 'STABLE' ? '−' : '?';
      },
      cellStyle: (params: any) => {
        const trend = params.value;
        let color = '#9ca3af';
        switch (trend) {
          case 'UP': color = '#4ade80'; break;
          case 'DOWN': color = '#f87171'; break;
          case 'STABLE': color = '#facc15'; break;
        }
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Price',
      field: 'AVER',
      width: 110,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : 'N/A',
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const mclean = data.MCLEAN && data.MCLEAN > 0 ? formatCurrency(data.MCLEAN) : 'N/A';
        const apple = data.APPLE && data.APPLE > 0 ? formatCurrency(data.APPLE) : 'N/A';
        const davidson = data.DAVIDSON && data.DAVIDSON > 0 ? formatCurrency(data.DAVIDSON) : 'N/A';
        const reva = data.reva && data.reva > 0 ? formatCurrency(data.reva) : 'N/A';
        return `MCLEAN: ${mclean}\nAPPLE: ${apple}\nDAVIDSON: ${davidson}\nREVA: ${reva}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#c084fc', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market',
      field: 'lowestComp',
      width: 110,
      valueGetter: (params: any) => {
        return params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2 || 0;
      },
      valueFormatter: (params: any) => {
        return params.value > 0 ? formatCurrency(params.value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const competitors = [
          { name: 'PHX', price: item.Nupharm },
          { name: 'AAH', price: item.AAH2 },
          { name: 'ETHN', price: item.ETH_NET },
          { name: 'LEX', price: item.LEXON2 }
        ].filter(comp => comp.price && comp.price > 0)
         .sort((a, b) => a.price - b.price);
        
        if (competitors.length === 0) {
          return 'No competitor pricing available';
        }
        
        // Build tooltip with competitor prices and trend information
        let tooltipLines = competitors.map(comp => {
          let line = `${comp.name}: ${formatCurrency(comp.price)}`;
          
          // Add trend information for each competitor if available
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'PHX' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'ETHN' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'LEX' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          }
          
          return line;
        });
        
        return tooltipLines.join('\n');
      },
      cellStyle: { textAlign: 'left' as const, color: '#60a5fa', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market Trend',
      field: 'marketTrend',
      width: 110,
      valueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendDisplay(item);
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendTooltip(item);
      },
      cellStyle: (params: any) => {
        const item = params.data.item;
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: getMarketTrendColor(item)
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
{
      headerName: 'Winning',
      field: 'winning',
      width: 90,
      valueGetter: (params: any) => {
        const lowestComp = params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2;
        const isWinning = params.data.AVER && lowestComp && params.data.AVER < lowestComp;
        return isWinning ? 'Y' : 'N';
      },
      cellStyle: (params: any) => {
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: params.value === 'Y' ? '#4ade80' : '#f87171'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Margin',
      field: 'margin',
      width: 110,
      valueGetter: (params: any) => calculateMargin(params.data),
      valueFormatter: (params: any) => formatMargin(params.value),
      cellStyle: (params: any) => {
        const margin = params.value;
        let color = '#9ca3af';
        if (margin !== null) {
          if (margin < 0) color = '#f87171';
          else if (margin < 10) color = '#fb923c';
          else if (margin < 20) color = '#facc15';
          else color = '#4ade80';
        }
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'SDT',
      field: 'SDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'EDT',
      field: 'EDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Star',
      field: 'starred',
      width: 60,
      valueGetter: (params: any) => starredItems.has(params.data.id) ? '★' : '☆',
      cellStyle: (params: any) => {
        const isStarred = starredItems.has(params.data.id);
        return {
          color: isStarred ? '#facc15' : '#6b7280',
          textAlign: 'center !important' as const,
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

  // Filter to show only starred items
  const starredItemsList = useMemo(() => {
    return data.analyzedItems.filter(item => starredItems.has(item.id));
  }, [data.analyzedItems, starredItems]);

  // Apply quick filter when search term changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  // Custom cell renderer component for Item column
  const ItemCellRenderer = (params: any) => {
    if (!params.data) return null;
    const stockcode = params.data.stockcode || '';
    const description = params.data.description || params.data.Description || '';
    
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Starred Items Analysis</h3>
        <div className="text-sm text-gray-400">
          {starredItemsList.length.toLocaleString()} starred items
        </div>
      </div>

      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {starredItemsList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No starred items found</div>
              <div className="text-sm mt-1">Star items to track them here</div>
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
                rowData={starredItemsList}
                onGridReady={onGridReady}
                components={{
                  itemCellRenderer: ItemCellRenderer
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

const StarredItemsAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
    nbp: string[];
    stockQty: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: [],
    stockQty: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
    stockQty: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: '',
    stockQty: ''
  });

  // Filter starred items
  const starredItemsList = useMemo(() => {
    return data.analyzedItems
      .filter(item => starredItems.has(item.id))
      .filter(item => {
        const matchesSearch = 
          item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(getWinningStatus(item));

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes(item.min_cost && item.min_cost > 0 ? 'Available' : 'N/A');

        const matchesStockQtyFilter = columnFilters.stockQty.length === 0 || 
          columnFilters.stockQty.includes((item.currentStock || 0) > 0 ? 'In Stock' : 'OOS');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter && matchesStockQtyFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'stockValue':
            aValue = a.stockValue; bValue = b.stockValue; break;
          case 'averageCost':
            aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
          case 'monthsOfStock':
            aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
            bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
            break;
          case 'currentStock':
            aValue = a.currentStock; bValue = b.currentStock; break;
          case 'onOrder':
            aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
          case 'nbp':
            aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
            bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
            const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
            aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
            bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
            bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.AVER || 0; bValue = b.AVER || 0; break;
          case 'sdt':
            aValue = a.SDT || 0; bValue = b.SDT || 0; break;
          case 'edt':
            aValue = a.EDT || 0; bValue = b.EDT || 0; break;
          default:
            aValue = a.stockcode; bValue = b.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.analyzedItems, starredItems, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getUniqueVelocityCategories = () => {
    // Get velocity categories from all analyzed items for comprehensive filter options
    const categories = [...new Set(data.analyzedItems
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    // Get trend directions from all analyzed items for comprehensive filter options
    const trends = [...new Set(data.analyzedItems
      .map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
  };

  const getUniqueStockQtyValues = () => {
    return ['In Stock', 'OOS'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative text-sm`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Starred Items Analysis</h3>
        <div className="text-sm text-gray-400">
          {starredItemsList.length} starred items
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Stock Qty', 'currentStock', 'stockQty', getUniqueStockQtyValues(), 'left')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort("monthsOfStock")}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('margin')}>
                    Margin {sortField === 'margin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'left')}
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {starredItemsList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-left text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              {(item.currentStock || 0).toLocaleString()}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">
                              Ringfenced: {(item.quantity_ringfenced || 0).toLocaleString()}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-left text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
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
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(item.trendDirection)}`}>
                      {item.trendDirection === 'UP' ? '↑' : 
                       item.trendDirection === 'DOWN' ? '↓' : 
                       item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-left text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className={`p-3 text-left font-semibold text-sm ${getMarginColor(calculateMargin(item))}`}>
                      {formatMargin(calculateMargin(item))}
                    </td>
                    <td className="p-3 text-left text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-left text-blue-400 font-semibold text-sm">
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
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {starredItemsList.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No starred items found</div>
              <div className="text-sm mt-1">Star items to track them here</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AllItemsAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
    nbp: string[];
    stockQty: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: [],
    stockQty: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
    stockQty: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: '',
    stockQty: ''
  });
  const [filterType, setFilterType] = useState<string>('all');

  // Filter and sort all items
  const filteredItems = useMemo(() => {
    let items = data.analyzedItems;

    // Apply category filter
    if (filterType === 'watchlist') {
      items = items.filter(item => item.watchlist === '⚠️');
    } else if (filterType === 'fast-movers') {
      items = items.filter(item => typeof item.velocityCategory === 'number' && item.velocityCategory <= 3);
    } else if (filterType === 'high-value') {
      items = items.filter(item => item.stockValue > 1000);
    } else if (filterType === 'cost-disadvantage-down') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const minCompPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        return item.avg_cost > minCompPrice && item.trendDirection === 'DOWN' && minCompPrice > 0;
      });
    } else if (filterType === 'margin-opportunity') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const marketLow = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        return item.avg_cost < marketLow && item.AVER && item.AVER < marketLow && marketLow > 0;
      });
    } else if (filterType === 'urgent-sourcing') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        if (competitorPrices.length === 0) return false;
        const avgCompPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
        const maxCompPrice = Math.max(...competitorPrices);
        // Show items where our cost is >5% above average competitor price OR >any competitor with stable/rising trend
        return (item.avg_cost > avgCompPrice * 1.05 || item.avg_cost > maxCompPrice) && ['STABLE', 'UP'].includes(item.trendDirection);
      });
    } else if (filterType === 'below-cost-lines') {
      items = items.filter(item => {
        return item.AVER && item.avg_cost && item.AVER < item.avg_cost;
      });
    } else if (filterType === 'dead-stock-alert') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const minCompPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        const hasCostDisadvantage = item.avg_cost > minCompPrice && minCompPrice > 0;
        return hasCostDisadvantage && item.trendDirection === 'DOWN' && item.monthsOfStock && item.monthsOfStock > 6;
      });
    } else if (filterType === 'eth-oos') {
      // ETH OOS - items that have the ❗ symbol
      items = items.filter(item => {
        return item.watchlist === '❗';
      });
    } else if (filterType === 'second-best-price') {
      // Second Best Price - our price is second best among competitors (one competitor beats us)
      items = items.filter(item => {
        if (!item.AVER || item.AVER <= 0) return false;
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        if (competitorPrices.length === 0) return false;
        
        // Sort prices (including ours) to find ranking
        const allPrices = [...competitorPrices, item.AVER].sort((a, b) => a - b);
        const ourRank = allPrices.indexOf(item.AVER) + 1; // 1-based ranking
        
        // We are second best if our rank is 2 (only 1 competitor beats us)
        return ourRank === 2;
      });
    } else if (filterType === 'ringfence') {
      // Ringfence - items that have ringfenced quantity > 0
      items = items.filter(item => {
        const ringfenced = item.quantity_ringfenced || 0;
        return ringfenced > 0;
      });
    }

    // Apply search filter
    items = items.filter(item => 
      item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply column filters
    const matchesVelocityFilter = (item: any) => {
      return columnFilters.velocityCategory.length === 0 || 
        columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');
    };

    const matchesTrendFilter = (item: any) => {
      return columnFilters.trendDirection.length === 0 || 
        columnFilters.trendDirection.includes(item.trendDirection || 'N/A');
    };

    const matchesWinningFilter = (item: any) => {
      if (columnFilters.winning.length === 0) return true;
      const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
      const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
      return columnFilters.winning.includes(isWinning ? 'Y' : 'N');
    };

    const matchesNbpFilter = (item: any) => {
      if (columnFilters.nbp.length === 0) return true;
      // Align with display logic: NBP is "Available" only if min_cost exists and > 0
      const nbpStatus = (item.min_cost && item.min_cost > 0) ? 'Available' : 'N/A';
      return columnFilters.nbp.includes(nbpStatus);
    };

    const matchesStockQtyFilter = (item: any) => {
      return columnFilters.stockQty.length === 0 || 
        columnFilters.stockQty.includes((item.currentStock || 0) > 0 ? 'In Stock' : 'OOS');
    };

    items = items.filter(item => matchesVelocityFilter(item) && matchesTrendFilter(item) && matchesWinningFilter(item) && matchesNbpFilter(item) && matchesStockQtyFilter(item));

    // Sort items
    return items.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'stockValue':
          aValue = a.stockValue; bValue = b.stockValue; break;
        case 'averageCost':
          aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
        case 'monthsOfStock':
          aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
        case 'velocityCategory':
          aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
          bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
          break;
        case 'currentStock':
          aValue = a.currentStock; bValue = b.currentStock; break;
        case 'onOrder':
          aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
        case 'nbp':
          aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
          bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
          break;
        case 'winning':
          const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
          const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
          aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
          bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
          break;
        case 'lowestComp':
          aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
          bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
          break;
        case 'price':
          aValue = a.AVER || 0; bValue = b.AVER || 0; break;
        case 'margin':
          // Calculate gross margin percentage: ((price - cost) / price) * 100
          aValue = (a.AVER && a.avg_cost && a.AVER > 0) ? ((a.AVER - a.avg_cost) / a.AVER) * 100 : -999;
          bValue = (b.AVER && b.avg_cost && b.AVER > 0) ? ((b.AVER - b.avg_cost) / b.AVER) * 100 : -999;
          break;
        case 'sdt':
          aValue = a.SDT || 0; bValue = b.SDT || 0; break;
        case 'edt':
          aValue = a.EDT || 0; bValue = b.EDT || 0; break;
        default:
          aValue = a.stockcode; bValue = b.stockcode;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data.analyzedItems, searchTerm, sortField, sortDirection, filterType, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.analyzedItems
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.analyzedItems.map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
  };

  const getUniqueStockQtyValues = () => {
    return ['In Stock', 'OOS'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative text-sm`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">All Items Analysis</h3>
        <div className="text-sm text-gray-400">
          {filteredItems.length.toLocaleString()} items
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Strategic Filters */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Strategic Filters</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('cost-disadvantage-down')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'cost-disadvantage-down' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                    }`}
                  >
                    🔻 Cost Risk
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Cost Disadvantage + Falling Prices</div>
                    <div>Products where our cost exceeds lowest competitor AND market prices are falling. Risk of being undercut.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('margin-opportunity')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'margin-opportunity' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
                    }`}
                  >
                    💰 Margin Win
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Immediate Margin Opportunities</div>
                    <div>Products where our cost is below market minimum. Can increase price while staying cheapest.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('urgent-sourcing')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'urgent-sourcing' 
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-orange-500/10 hover:text-orange-300 border border-gray-700/50'
                    }`}
                  >
                    ⚡ Uncompetitive Cost
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Uncompetitive Cost Alert</div>
                    <div>Products where our cost is above market low with stable/rising trends. No price relief coming.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('below-cost-lines')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'below-cost-lines' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                    }`}
                  >
                    📉 Below Cost
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Below Cost Lines</div>
                    <div>Products where our selling price is below average cost. Items selling at a loss requiring immediate attention.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('dead-stock-alert')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'dead-stock-alert' 
                        ? 'bg-red-600/20 text-red-400 border border-red-600/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-red-600/10 hover:text-red-400 border border-gray-700/50'
                    }`}
                  >
                    ☠️ Dead Stock
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Dead Stock Alert</div>
                    <div>High cost + falling prices + overstocked (&gt;6 months). Critical clearance priority to minimize losses.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('eth-oos')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'eth-oos' 
                        ? 'bg-red-600/20 text-red-400 border border-red-600/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-red-600/10 hover:text-red-400 border border-gray-700/50'
                    }`}
                  >
                    ❗ ETH OOS
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">ETH OOS</div>
                    <div>Items that have the ❗ symbol</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('second-best-price')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'second-best-price' 
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-green-600/10 hover:text-green-400 border border-gray-700/50'
                    }`}
                  >
                    🥈 Second Best Price
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Second Best Price</div>
                    <div>Our price is second best among competitors (one competitor beats us)</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('ringfence')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'ringfence' 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-blue-600/10 hover:text-blue-400 border border-gray-700/50'
                    }`}
                  >
                    🛡️ Ringfence
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Ringfence</div>
                    <div>Items with ringfenced stock quantity greater than 0</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          {filterType !== 'all' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className="text-xs text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
              >
                ← Clear Filter
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Stock Qty', 'currentStock', 'stockQty', getUniqueStockQtyValues(), 'left')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort("monthsOfStock")}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('margin')}>
                    Margin {sortField === 'margin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'left')}
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-left text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {(item.currentStock || item.stock || 0).toLocaleString()}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">Ringfenced: {(item.quantity_ringfenced || 0).toLocaleString()}</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-left text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
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
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={`text-lg font-bold ${getTrendColor(item.trendDirection)}`}>
                        {item.trendDirection === 'UP' ? '↑' :
                         item.trendDirection === 'DOWN' ? '↓' :
                         item.trendDirection === 'STABLE' ? '−' : '?'}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-left text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className={`p-3 text-left font-semibold text-sm ${getMarginColor(calculateMargin(item))}`}>
                      {formatMargin(calculateMargin(item))}
                    </td>
                    <td className="p-3 text-left text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-left text-blue-400 font-semibold text-sm">
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
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">
                                  {comp.name}: {formatCurrency(comp.price)}
                                  {comp.name === 'AAH2' && shouldShowAAHTrendTooltip(item) && (
                                    <div className="text-xs text-gray-300 mt-1 pl-2 border-l border-gray-600">
                                      {getAAHTrendTooltip(item).split('\n').map((line, lineIdx) => (
                                        <div key={lineIdx}>{line}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// AG Grid All Items Analysis Component
const AllItemsAGGrid: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [competitorFilter, setCompetitorFilter] = useState<string>('none');
  const [strategicTab, setStrategicTab] = useState<string>('risks');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Format currency function  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Handler for price changes - captures and logs the change
  const handlePriceChange = (params: any) => {
    const { data, oldValue, newValue } = params;
    console.log('Price changed for item:', {
      stockcode: data.stockcode,
      description: data.description || data.Description,
      oldPrice: oldValue,
      newPrice: newValue,
      change: newValue - oldValue
    });
    
    // Here you could add logic to:
    // - Update the backend/database
    // - Show a notification
    // - Update related calculations
    // - Trigger other updates
  };

  // Parse currency input - removes currency symbols and converts to number
  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    // Remove currency symbols, commas, and extra spaces
    const cleanValue = value.replace(/[£$€,\s]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Column definitions for AG Grid
  const columnDefs: ColDef[] = [
    {
      headerName: 'Watch',
      field: 'watchlist',
      pinned: 'left',
      width: 80,
      valueFormatter: (params: any) => params.value || '−',
      cellClass: 'text-center',
      cellStyle: (params: any) => {
        const watchlist = params.value || '';
        // Show orange if any warning icon is present
        const hasWarning = watchlist.includes('⚠️') || watchlist.includes('❗');
        return {
          textAlign: 'center !important' as const,
          color: hasWarning ? '#fb923c' : '#6b7280',
          fontSize: '16px'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Item',
      field: 'stockcode',
      pinned: 'left',
      width: 300,
      valueGetter: (params: any) => params.data.stockcode,
      cellRenderer: 'itemCellRenderer',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Group',
      field: 'velocityCategory',
      width: 90,
      valueFormatter: (params: any) => {
        const category = params.value;
        return typeof category === 'number' ? category.toString() : 'N/A';
      },
      cellStyle: (params: any) => {
        const category = params.value;
        let color = '#9ca3af'; // default gray
        if (typeof category === 'number') {
          if (category <= 2) color = '#4ade80'; // green
          else if (category <= 4) color = '#facc15'; // yellow
          else color = '#f87171'; // red
        }
        return {
          textAlign: 'center !important' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock £',
      field: 'stockValue',
      width: 110,
      valueFormatter: (params: any) => {
        const value = params.value || 0;
        return formatCurrency(value);
      },
      cellClass: 'text-left text-white',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock Qty',
      field: 'currentStock',
      width: 110,
      valueGetter: (params: any) => params.data.currentStock || params.data.stock || 0,
      valueFormatter: (params: any) => params.value.toLocaleString(),
      tooltipValueGetter: (params: any) => {
        const ringfenced = params.data.quantity_ringfenced || 0;
        return `RF: ${ringfenced.toLocaleString()}`;
      },
      cellStyle: (params: any) => {
        const currentStock = params.value || 0;
        const ringfenced = params.data.quantity_ringfenced || 0;
        
        // Calculate ringfenced percentage (0-100%)
        const ringfencedPercent = currentStock > 0 ? Math.min((ringfenced / currentStock) * 100, 100) : 0;
        
        // Create transparent fill that's proportional to ringfenced percentage
        let backgroundImage = 'none';
        
        if (ringfencedPercent > 0) {
          // Determine color based on ringfenced percentage
          let fillColor = '#fbbf24'; // yellow-400 (default)
          if (ringfencedPercent >= 25 && ringfencedPercent < 50) fillColor = '#f97316'; // orange-500
          else if (ringfencedPercent >= 50 && ringfencedPercent < 75) fillColor = '#dc2626'; // red-600
          else if (ringfencedPercent >= 75) fillColor = '#991b1b'; // red-800
          
          // Create fill that's exactly proportional to ringfenced percentage (transparent)
          backgroundImage = `linear-gradient(to top, ${fillColor}15 0%, ${fillColor}15 ${ringfencedPercent}%, transparent ${ringfencedPercent}%, transparent 100%)`;
        }
        
        return {
          textAlign: 'left' as const,
          color: '#d1d5db', // gray-300
          backgroundImage: backgroundImage,
          paddingRight: '8px'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Usage',
      field: 'averageUsage',
      width: 100,
      valueGetter: (params: any) => {
        return params.data.averageUsage || params.data.packs_sold_avg_last_six_months;
      },
      valueFormatter: (params: any) => {
        const usage = params.value;
        return usage ? `${usage.toFixed(0)}` : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const last30Days = params.data.packs_sold_last_30_days;
        const revaLast30Days = params.data.packs_sold_reva_last_30_days;
        
        let tooltip = '';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `Last 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          if (tooltip) tooltip += '\n';
          tooltip += `Reva Usage: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip || 'No recent usage data available';
      },
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Months',
      field: 'monthsOfStock',
      width: 90,
      valueFormatter: (params: any) => {
        const months = params.value;
        return months === 999.9 ? '∞' : months ? months.toFixed(1) : 'N/A';
      },
      cellStyle: (params: any) => {
        const months = params.value;
        return {
          textAlign: 'left' as const,
          fontWeight: months && months > 6 ? 'bold' : 'normal',
          color: months && months > 6 ? '#f87171' : '#d1d5db'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'On Order',
      field: 'quantity_on_order',
      width: 110,
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Avg Cost',
      field: 'avg_cost',
      width: 110,
      valueGetter: (params: any) => getDisplayedAverageCost(params.data),
      valueFormatter: (params: any) => {
        const value = params.value;
        return value ? formatCurrency(value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        return shouldShowAverageCostTooltip(params.data) ? getAverageCostTooltip(params.data) : null;
      },
      cellClass: 'text-left text-gray-300 font-bold',
      sortable: true,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'NBP',
      field: 'min_cost',
      width: 110,
      valueFormatter: (params: any) => {
        const minCost = params.value;
        return minCost && minCost > 0 ? formatCurrency(minCost) : 'OOS';
      },
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const nextCost = data.next_cost && data.next_cost > 0 ? formatCurrency(data.next_cost) : 'N/A';
        const minCost = data.min_cost && data.min_cost > 0 ? formatCurrency(data.min_cost) : 'N/A';
        const lastPoCost = data.last_po_cost && data.last_po_cost > 0 ? formatCurrency(data.last_po_cost) : 'N/A';
        return `Next Cost: ${nextCost}\nMin Cost: ${minCost}\nLast PO Cost: ${lastPoCost}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#3b82f6', fontWeight: 'bold' }, // blue-500
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Buying Trend',
      field: 'trendDirection',
      width: 110,
      valueFormatter: (params: any) => {
        const trend = params.value;
        return trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : trend === 'STABLE' ? '−' : '?';
      },
      cellStyle: (params: any) => {
        const trend = params.value;
        let color = '#9ca3af'; // default gray
        switch (trend) {
          case 'UP': color = '#4ade80'; break; // green
          case 'DOWN': color = '#f87171'; break; // red
          case 'STABLE': color = '#facc15'; break; // yellow
        }
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Price',
      field: 'AVER',
      width: 110,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 999999,
        precision: 2,
        step: 0.01,
        showStepperButtons: true
      },
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : 'N/A',
      valueSetter: (params: any) => {
        const newValue = typeof params.newValue === 'string' ? parseCurrencyInput(params.newValue) : params.newValue;
        if (newValue !== params.data.AVER) {
          params.data.AVER = newValue;
          return true;
        }
        return false;
      },
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const mclean = data.MCLEAN && data.MCLEAN > 0 ? formatCurrency(data.MCLEAN) : 'N/A';
        const apple = data.APPLE && data.APPLE > 0 ? formatCurrency(data.APPLE) : 'N/A';
        const davidson = data.DAVIDSON && data.DAVIDSON > 0 ? formatCurrency(data.DAVIDSON) : 'N/A';
        const reva = data.reva && data.reva > 0 ? formatCurrency(data.reva) : 'N/A';
        return `EDITABLE: Double-click to edit price\n\nCurrent Branch Prices:\nMCLEAN: ${mclean}\nAPPLE: ${apple}\nDAVIDSON: ${davidson}\nREVA: ${reva}\n\nTip: Use Enter to save, Escape to cancel`;
      },
      cellStyle: (params: any) => ({
        textAlign: 'left' as const,
        color: '#c084fc',
        fontWeight: 'bold',
        cursor: 'pointer',
        border: '1px solid #c084fc20',
        backgroundColor: params.node.rowIndex % 2 === 0 ? '#c084fc05' : '#c084fc08'
      }),
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true,
      onCellValueChanged: handlePriceChange
    },
    {
      headerName: 'Market',
      field: 'lowestComp',
      width: 110,
      valueGetter: (params: any) => {
        return params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2 || 0;
      },
      valueFormatter: (params: any) => {
        return params.value > 0 ? formatCurrency(params.value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const competitors = [
          { name: 'PHX', price: item.Nupharm },
          { name: 'AAH', price: item.AAH2 },
          { name: 'ETHN', price: item.ETH_NET },
          { name: 'LEX', price: item.LEXON2 }
        ].filter(comp => comp.price && comp.price > 0)
         .sort((a, b) => a.price - b.price);
        
        if (competitors.length === 0) {
          return 'No competitor pricing available';
        }
        
        // Build tooltip with competitor prices and trend information
        let tooltipLines = competitors.map(comp => {
          let line = `${comp.name}: ${formatCurrency(comp.price)}`;
          
          // Add trend information for each competitor if available
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'PHX' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'ETHN' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'LEX' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          }
          
          return line;
        });
        
        return tooltipLines.join('\n');
      },
      cellStyle: { textAlign: 'left' as const, color: '#60a5fa', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Winning',
      field: 'winning',
      width: 90,
      valueGetter: (params: any) => {
        const lowestComp = params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2;
        const isWinning = params.data.AVER && lowestComp && params.data.AVER < lowestComp;
        return isWinning ? 'Y' : 'N';
      },
      cellStyle: (params: any) => {
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: params.value === 'Y' ? '#4ade80' : '#f87171'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Margin',
      field: 'margin',
      width: 110,
      valueGetter: (params: any) => calculateMargin(params.data),
      valueFormatter: (params: any) => formatMargin(params.value),
      cellStyle: (params: any) => {
        const margin = params.value;
        let color = '#9ca3af'; // default gray
        if (margin !== null) {
          if (margin < 0) color = '#f87171'; // red
          else if (margin < 10) color = '#fb923c'; // orange
          else if (margin < 20) color = '#facc15'; // yellow
          else color = '#4ade80'; // green
        }
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'SDT',
      field: 'SDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'EDT',
      field: 'EDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Star',
      field: 'starred',
      width: 60,
      valueGetter: (params: any) => starredItems.has(params.data.id) ? '★' : '☆',
      cellStyle: (params: any) => {
        const isStarred = starredItems.has(params.data.id);
        return {
          color: isStarred ? '#facc15' : '#6b7280',
          textAlign: 'center !important' as const,
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

  // Calculate competitor filter counts
  const competitorCounts = useMemo(() => {
    const items = [...data.analyzedItems];
    
    const counts = {
      'overall-avg': 0,
      'eth-up': 0,
      'eth-down': 0,
      'aah-up': 0,
      'aah-down': 0,
      'phx-up': 0,
      'phx-down': 0,
      'lex-up': 0,
      'lex-down': 0
    };
    
    items.forEach(item => {
      const movements = getCompetitorMovements(item);
      
      if (movements.average !== null && Math.abs(movements.average) > 0.1) {
        counts['overall-avg']++;
      }
      if (movements.eth !== null && movements.eth > 0.1) {
        counts['eth-up']++;
      }
      if (movements.eth !== null && movements.eth < -0.1) {
        counts['eth-down']++;
      }
      if (movements.aah !== null && movements.aah > 0.1) {
        counts['aah-up']++;
      }
      if (movements.aah !== null && movements.aah < -0.1) {
        counts['aah-down']++;
      }
      if (movements.phx !== null && movements.phx > 0.1) {
        counts['phx-up']++;
      }
      if (movements.phx !== null && movements.phx < -0.1) {
        counts['phx-down']++;
      }
      if (movements.lex !== null && movements.lex > 0.1) {
        counts['lex-up']++;
      }
      if (movements.lex !== null && movements.lex < -0.1) {
        counts['lex-down']++;
      }
    });
    
    return counts;
  }, [data.analyzedItems]);

  // Apply strategic filters (same logic as current AllItemsAnalysis)
  const filteredData = useMemo(() => {
    let items = [...data.analyzedItems];

    // Apply strategic filters
    if (filterType === 'watchlist') {
      items = items.filter(item => item.watchlist === '⚠️');
    } else if (filterType === 'fast-movers') {
      items = items.filter(item => typeof item.velocityCategory === 'number' && item.velocityCategory <= 3);
    } else if (filterType === 'high-value') {
      items = items.filter(item => item.stockValue > 1000);
    } else if (filterType === 'cost-disadvantage-down') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const minCompPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        return item.avg_cost > minCompPrice && item.trendDirection === 'DOWN' && minCompPrice > 0;
      });
    } else if (filterType === 'margin-opportunity') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const marketLow = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        return item.avg_cost < marketLow && item.AVER && item.AVER < marketLow && marketLow > 0;
      });
    } else if (filterType === 'urgent-sourcing') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        if (competitorPrices.length === 0) return false;
        const avgCompPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
        const maxCompPrice = Math.max(...competitorPrices);
        return (item.avg_cost > avgCompPrice * 1.05 || item.avg_cost > maxCompPrice) && ['STABLE', 'UP'].includes(item.trendDirection);
      });
    } else if (filterType === 'below-cost-lines') {
      items = items.filter(item => {
        return item.AVER && item.avg_cost && item.AVER < item.avg_cost;
      });
    } else if (filterType === 'dead-stock-alert') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const minCompPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        const hasCostDisadvantage = item.avg_cost > minCompPrice && minCompPrice > 0;
        return hasCostDisadvantage && item.trendDirection === 'DOWN' && item.monthsOfStock && item.monthsOfStock > 6;
      });
    } else if (filterType === 'eth-oos') {
      // ETH OOS - items that have the ❗ symbol
      items = items.filter(item => {
        return item.watchlist === '❗';
      });
    } else if (filterType === 'second-best-price') {
      // Second Best Price - our price is second best among competitors (one competitor beats us)
      items = items.filter(item => {
        if (!item.AVER || item.AVER <= 0) return false;
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        if (competitorPrices.length === 0) return false;
        
        // Sort prices (including ours) to find ranking
        const allPrices = [...competitorPrices, item.AVER].sort((a, b) => a - b);
        const ourRank = allPrices.indexOf(item.AVER) + 1; // 1-based ranking
        
        // We are second best if our rank is 2 (only 1 competitor beats us)
        return ourRank === 2;
      });
    } else if (filterType === 'ringfence') {
      // Ringfence - items that have ringfenced quantity > 0
      items = items.filter(item => {
        const ringfenced = item.quantity_ringfenced || 0;
        return ringfenced > 0;
      });
    }

    // Apply competitor price movement filters
    if (competitorFilter !== 'none') {
      items = items.filter(item => {
        const movements = getCompetitorMovements(item);
        
        switch (competitorFilter) {
          case 'overall-avg':
            return movements.average !== null && Math.abs(movements.average) > 0.1;
          case 'overall-max':
            return movements.maxAbsolute !== null && Math.abs(movements.maxAbsolute) > 0.1;
          case 'eth-up':
            return movements.eth !== null && movements.eth > 0.1;
          case 'eth-down':
            return movements.eth !== null && movements.eth < -0.1;
          case 'aah-up':
            return movements.aah !== null && movements.aah > 0.1;
          case 'aah-down':
            return movements.aah !== null && movements.aah < -0.1;
          case 'phx-up':
            return movements.phx !== null && movements.phx > 0.1;
          case 'phx-down':
            return movements.phx !== null && movements.phx < -0.1;
          case 'lex-up':
            return movements.lex !== null && movements.lex > 0.1;
          case 'lex-down':
            return movements.lex !== null && movements.lex < -0.1;
          default:
            return true;
        }
      });

      // Sort by movement magnitude for competitor filters
      if (competitorFilter !== 'none') {
        items.sort((a, b) => {
          const aMovements = getCompetitorMovements(a);
          const bMovements = getCompetitorMovements(b);
          
          let aValue = 0;
          let bValue = 0;
          
          switch (competitorFilter) {
            case 'overall-avg':
              aValue = Math.abs(aMovements.average || 0);
              bValue = Math.abs(bMovements.average || 0);
              break;
            case 'overall-max':
              aValue = Math.abs(aMovements.maxAbsolute || 0);
              bValue = Math.abs(bMovements.maxAbsolute || 0);
              break;
            case 'eth-up':
            case 'eth-down':
              aValue = Math.abs(aMovements.eth || 0);
              bValue = Math.abs(bMovements.eth || 0);
              break;
            case 'aah-up':
            case 'aah-down':
              aValue = Math.abs(aMovements.aah || 0);
              bValue = Math.abs(bMovements.aah || 0);
              break;
            case 'phx-up':
            case 'phx-down':
              aValue = Math.abs(aMovements.phx || 0);
              bValue = Math.abs(bMovements.phx || 0);
              break;
            case 'lex-up':
            case 'lex-down':
              aValue = Math.abs(aMovements.lex || 0);
              bValue = Math.abs(bMovements.lex || 0);
              break;
          }
          
          return bValue - aValue; // Sort by highest movement first
        });
      }
    }

        return items;
  }, [data.analyzedItems, filterType, competitorFilter]);


  
  // Apply quick filter when search term changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  // Custom cell renderer component for Item column
  const ItemCellRenderer = (params: any) => {
    if (!params.data) return null;
    const stockcode = params.data.stockcode || '';
    const description = params.data.description || params.data.Description || '';
    
    console.log('Item data:', { stockcode, description, data: params.data }); // Debug log
    
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

  return (
    <div className="space-y-6">
      {/* Same header as current */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">All Items Analysis</h3>
        <div className="text-sm text-gray-400">
          {filteredData.length.toLocaleString()} items
        </div>
      </div>

      {/* Same search component */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Strategic Filters with Tabs */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Strategic Filters</h4>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-4">
            <button
              onClick={() => setStrategicTab('risks')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                strategicTab === 'risks' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
              }`}
            >
              Risks
            </button>
            <button
              onClick={() => setStrategicTab('rewards')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                strategicTab === 'rewards' 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
              }`}
            >
              Rewards
            </button>
            <button
              onClick={() => setStrategicTab('competitors')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                strategicTab === 'competitors' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 border border-gray-700/50'
              }`}
            >
              Competitors
            </button>
          </div>

          {/* Risks Tab */}
          {strategicTab === 'risks' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('cost-disadvantage-down')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'cost-disadvantage-down' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                      }`}
                    >
                      🔻 Cost Risk
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Cost Disadvantage + Falling Prices</div>
                      <div>Products where our cost exceeds lowest competitor AND market prices are falling. Risk of being undercut.</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>

              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('urgent-sourcing')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'urgent-sourcing' 
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-orange-500/10 hover:text-orange-300 border border-gray-700/50'
                      }`}
                    >
                      ⚡ Uncompetitive Cost
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Uncompetitive Cost Alert</div>
                      <div>Products where our cost is above market low with stable/rising trends. No price relief coming.</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>

              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('below-cost-lines')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'below-cost-lines' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                      }`}
                    >
                      📉 Below Cost
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Below Cost Lines</div>
                      <div>Products where our selling price is below average cost. Items selling at a loss requiring immediate attention.</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>

              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('dead-stock-alert')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'dead-stock-alert' 
                          ? 'bg-red-600/20 text-red-400 border border-red-600/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-600/10 hover:text-red-400 border border-gray-700/50'
                      }`}
                    >
                      ☠️ Dead Stock
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Dead Stock Alert</div>
                      <div>High cost + falling prices + overstocked (&gt;6 months). Critical clearance priority to minimize losses.</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Rewards Tab */}
          {strategicTab === 'rewards' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('margin-opportunity')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'margin-opportunity' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
                      }`}
                    >
                      💰 Margin Win
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Immediate Margin Opportunities</div>
                      <div>Products where our cost is below market minimum. Can increase price while staying cheapest.</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>

              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('second-best-price')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'second-best-price' 
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-green-600/10 hover:text-green-400 border border-gray-700/50'
                      }`}
                    >
                      🥈 Second Best Price
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Second Best Price</div>
                      <div>Our price is second best among competitors (one competitor beats us)</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>

              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('eth-oos')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'eth-oos' 
                          ? 'bg-red-600/20 text-red-400 border border-red-600/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-600/10 hover:text-red-400 border border-gray-700/50'
                      }`}
                    >
                      ❗ ETH OOS
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">ETH OOS</div>
                      <div>Items that have the ❗ symbol</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>

              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterType('ringfence')}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        filterType === 'ringfence' 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-blue-600/10 hover:text-blue-400 border border-gray-700/50'
                      }`}
                    >
                      🛡️ Ringfence
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Ringfence</div>
                      <div>Items with ringfenced stock quantity greater than 0</div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Competitors Tab */}
          {strategicTab === 'competitors' && (
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-2">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCompetitorFilter('overall-avg')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      competitorFilter === 'overall-avg' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 border border-gray-700/50'
                    }`}
                  >
                    📊 Overall ({competitorCounts['overall-avg']})
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Overall Price Movement</div>
                    <div>Shows products where the average competitor movement is significant. Indicates broad market trends.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCompetitorFilter('eth-up')}
                      className={`flex-1 p-2 rounded-l-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'eth-up' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
                      }`}
                    >
                      ETH ↑ ({competitorCounts['eth-up']})
                    </button>
                    <button
                      onClick={() => setCompetitorFilter('eth-down')}
                      className={`flex-1 p-2 rounded-r-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'eth-down' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                      }`}
                    >
                      ETH ↓ ({competitorCounts['eth-down']})
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">ETH Price Movement</div>
                    <div>ETH ↑: Price increases (sales opportunity)<br/>ETH ↓: Price decreases (review pricing)</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCompetitorFilter('aah-up')}
                      className={`flex-1 p-2 rounded-l-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'aah-up' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
                      }`}
                    >
                      AAH ↑ ({competitorCounts['aah-up']})
                    </button>
                    <button
                      onClick={() => setCompetitorFilter('aah-down')}
                      className={`flex-1 p-2 rounded-r-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'aah-down' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                      }`}
                    >
                      AAH ↓ ({competitorCounts['aah-down']})
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">AAH Price Movement</div>
                    <div>AAH ↑: Price increases (sales opportunity)<br/>AAH ↓: Price decreases (review pricing)</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCompetitorFilter('phx-up')}
                      className={`flex-1 p-2 rounded-l-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'phx-up' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
                      }`}
                    >
                      PHX ↑ ({competitorCounts['phx-up']})
                    </button>
                    <button
                      onClick={() => setCompetitorFilter('phx-down')}
                      className={`flex-1 p-2 rounded-r-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'phx-down' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                      }`}
                    >
                      PHX ↓ ({competitorCounts['phx-down']})
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">PHX Price Movement</div>
                    <div>PHX ↑: Price increases (sales opportunity)<br/>PHX ↓: Price decreases (review pricing)</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCompetitorFilter('lex-up')}
                      className={`flex-1 p-2 rounded-l-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'lex-up' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
                      }`}
                    >
                      LEX ↑ ({competitorCounts['lex-up']})
                    </button>
                    <button
                      onClick={() => setCompetitorFilter('lex-down')}
                      className={`flex-1 p-2 rounded-r-lg text-xs font-medium transition-all duration-200 ${
                        competitorFilter === 'lex-down' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                      }`}
                    >
                      LEX ↓ ({competitorCounts['lex-down']})
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">LEX Price Movement</div>
                    <div>LEX ↑: Price increases (sales opportunity)<br/>LEX ↓: Price decreases (review pricing)</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          )}

          {competitorFilter !== 'none' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setCompetitorFilter('none')}
                className="text-xs text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
              >
                ← Clear Competitor Filter
              </button>
            </div>
          )}

          {/* Clear Filter Button */}
          {(filterType !== 'all' || competitorFilter !== 'none') && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterType('all');
                  setCompetitorFilter('none');
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
              >
                ← Clear All Filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AG Grid Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No data available</div>
              <div className="text-sm mt-1">Check your data upload or filters</div>
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
                rowData={filteredData}
                onGridReady={onGridReady}
                onCellValueChanged={handlePriceChange}
                components={{
                  itemCellRenderer: ItemCellRenderer
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
                suppressCellFocus={false}
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

// Overstock AG Grid Component
const OverstockAGGrid: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Format currency function  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Column definitions for AG Grid (identical to AllItemsAGGrid)
  const columnDefs: ColDef[] = [
    {
      headerName: 'Watch',
      field: 'watchlist',
      pinned: 'left',
      width: 80,
      valueFormatter: (params: any) => params.value || '−',
      cellClass: 'text-center',
      cellStyle: (params: any) => {
        const watchlist = params.value || '';
        // Show orange if any warning icon is present
        const hasWarning = watchlist.includes('⚠️') || watchlist.includes('❗');
        return {
          textAlign: 'center !important' as const,
          color: hasWarning ? '#fb923c' : '#6b7280',
          fontSize: '16px'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Item',
      field: 'stockcode',
      pinned: 'left',
      width: 300,
      valueGetter: (params: any) => params.data.stockcode,
      cellRenderer: 'itemCellRenderer',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Group',
      field: 'velocityCategory',
      width: 90,
      valueFormatter: (params: any) => {
        const category = params.value;
        return typeof category === 'number' ? category.toString() : 'N/A';
      },
      cellStyle: (params: any) => {
        const category = params.value;
        let color = '#9ca3af'; // default gray
        if (typeof category === 'number') {
          if (category <= 2) color = '#4ade80'; // green
          else if (category <= 4) color = '#facc15'; // yellow
          else color = '#f87171'; // red
        }
        return {
          textAlign: 'center !important' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock £',
      field: 'stockValue',
      width: 110,
      valueFormatter: (params: any) => {
        const value = params.value || 0;
        return formatCurrency(value);
      },
      cellClass: 'text-left text-white',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock Qty',
      field: 'currentStock',
      width: 110,
      valueGetter: (params: any) => params.data.currentStock || params.data.stock || 0,
      valueFormatter: (params: any) => params.value.toLocaleString(),
      tooltipValueGetter: (params: any) => {
        const ringfenced = params.data.quantity_ringfenced || 0;
        return `RF: ${ringfenced.toLocaleString()}`;
      },
      cellStyle: (params: any) => {
        const currentStock = params.value || 0;
        const ringfenced = params.data.quantity_ringfenced || 0;
        
        // Calculate ringfenced percentage (0-100%)
        const ringfencedPercent = currentStock > 0 ? Math.min((ringfenced / currentStock) * 100, 100) : 0;
        
        // Create transparent fill that's proportional to ringfenced percentage
        let backgroundImage = 'none';
        
        if (ringfencedPercent > 0) {
          // Determine color based on ringfenced percentage
          let fillColor = '#fbbf24'; // yellow-400 (default)
          if (ringfencedPercent >= 25 && ringfencedPercent < 50) fillColor = '#f97316'; // orange-500
          else if (ringfencedPercent >= 50 && ringfencedPercent < 75) fillColor = '#dc2626'; // red-600
          else if (ringfencedPercent >= 75) fillColor = '#991b1b'; // red-800
          
          // Create fill that's exactly proportional to ringfenced percentage (transparent)
          backgroundImage = `linear-gradient(to top, ${fillColor}15 0%, ${fillColor}15 ${ringfencedPercent}%, transparent ${ringfencedPercent}%, transparent 100%)`;
        }
        
        return {
          textAlign: 'left' as const,
          color: '#d1d5db', // gray-300
          backgroundImage: backgroundImage,
          paddingRight: '8px'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Usage',
      field: 'averageUsage',
      width: 100,
      valueGetter: (params: any) => {
        const item = params.data;
        return item?.averageUsage || item?.packs_sold_avg_last_six_months;
      },
      valueFormatter: (params: any) => {
        const usage = params.value;
        return usage ? `${usage.toFixed(0)}` : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const last30Days = item?.packs_sold_last_30_days;
        const revaLast30Days = item?.packs_sold_reva_last_30_days;
        
        let tooltip = '';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `Last 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          if (tooltip) tooltip += '\n';
          tooltip += `Reva Usage: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip || 'No recent usage data available';
      },
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Months',
      field: 'monthsOfStock',
      width: 90,
      valueFormatter: (params: any) => {
        const months = params.value;
        return months === 999.9 ? '∞' : months ? months.toFixed(1) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const usage = params.data.averageUsage || params.data.packs_sold_avg_last_six_months;
        const last30Days = params.data.packs_sold_last_30_days;
        const revaLast30Days = params.data.packs_sold_reva_last_30_days;
        
        let tooltip = usage ? `${usage.toFixed(0)} packs/month (6mo avg)` : 'No usage data (6mo avg)';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `\nLast 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          tooltip += `\nReva last 30 days: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip;
      },
      cellStyle: (params: any) => {
        const months = params.value;
        return {
          textAlign: 'left' as const,
          fontWeight: months && months > 6 ? 'bold' : 'normal',
          color: months && months > 6 ? '#f87171' : '#d1d5db'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'On Order',
      field: 'quantity_on_order',
      width: 110,
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Avg Cost',
      field: 'avg_cost',
      width: 110,
      valueGetter: (params: any) => getDisplayedAverageCost(params.data),
      valueFormatter: (params: any) => {
        const value = params.value;
        return value ? formatCurrency(value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        return shouldShowAverageCostTooltip(params.data) ? getAverageCostTooltip(params.data) : null;
      },
      cellClass: 'text-left text-gray-300 font-bold',
      sortable: true,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'NBP',
      field: 'min_cost',
      width: 110,
      valueFormatter: (params: any) => {
        const minCost = params.value;
        return minCost && minCost > 0 ? formatCurrency(minCost) : 'OOS';
      },
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const nextCost = data.next_cost && data.next_cost > 0 ? formatCurrency(data.next_cost) : 'N/A';
        const minCost = data.min_cost && data.min_cost > 0 ? formatCurrency(data.min_cost) : 'N/A';
        const lastPoCost = data.last_po_cost && data.last_po_cost > 0 ? formatCurrency(data.last_po_cost) : 'N/A';
        return `Next Cost: ${nextCost}\nMin Cost: ${minCost}\nLast PO Cost: ${lastPoCost}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#3b82f6', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Buying Trend',
      field: 'trendDirection',
      width: 110,
      valueFormatter: (params: any) => {
        const trend = params.value;
        return trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : trend === 'STABLE' ? '−' : '?';
      },
      cellStyle: (params: any) => {
        const trend = params.value;
        let color = '#9ca3af'; // default gray
        switch (trend) {
          case 'UP': color = '#4ade80'; break; // green
          case 'DOWN': color = '#f87171'; break; // red
          case 'STABLE': color = '#facc15'; break; // yellow
        }
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Price',
      field: 'AVER',
      width: 110,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : 'N/A',
      tooltipValueGetter: (params: any) => {
        const data = params.data;
        const mclean = data.MCLEAN && data.MCLEAN > 0 ? formatCurrency(data.MCLEAN) : 'N/A';
        const apple = data.APPLE && data.APPLE > 0 ? formatCurrency(data.APPLE) : 'N/A';
        const davidson = data.DAVIDSON && data.DAVIDSON > 0 ? formatCurrency(data.DAVIDSON) : 'N/A';
        const reva = data.reva && data.reva > 0 ? formatCurrency(data.reva) : 'N/A';
        return `MCLEAN: ${mclean}\nAPPLE: ${apple}\nDAVIDSON: ${davidson}\nREVA: ${reva}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#c084fc', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market',
      field: 'lowestComp',
      width: 110,
      valueGetter: (params: any) => {
        return params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2 || 0;
      },
      valueFormatter: (params: any) => {
        return params.value > 0 ? formatCurrency(params.value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const competitors = [
          { name: 'PHX', price: item.Nupharm },
          { name: 'AAH', price: item.AAH2 },
          { name: 'ETHN', price: item.ETH_NET },
          { name: 'LEX', price: item.LEXON2 }
        ].filter(comp => comp.price && comp.price > 0)
         .sort((a, b) => a.price - b.price);
        
        if (competitors.length === 0) {
          return 'No competitor pricing available';
        }
        
        // Build tooltip with competitor prices and trend information
        let tooltipLines = competitors.map(comp => {
          let line = `${comp.name}: ${formatCurrency(comp.price)}`;
          
          // Add trend information for each competitor if available
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'PHX' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'ETHN' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'LEX' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          }
          
          return line;
        });
        
        return tooltipLines.join('\n');
      },
      cellStyle: { textAlign: 'left' as const, color: '#60a5fa', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market Trend',
      field: 'marketTrend',
      width: 110,
      valueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendDisplay(item);
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data.item;
        return getMarketTrendTooltip(item);
      },
      cellStyle: (params: any) => {
        const item = params.data.item;
        return {
          textAlign: 'left' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: getMarketTrendColor(item)
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
{
      headerName: 'Winning',
      field: 'winning',
      width: 90,
      valueGetter: (params: any) => {
        const lowestComp = params.data.bestCompetitorPrice || params.data.lowestMarketPrice || params.data.Nupharm || params.data.AAH2 || params.data.LEXON2;
        const isWinning = params.data.AVER && lowestComp && params.data.AVER < lowestComp;
        return isWinning ? 'Y' : 'N';
      },
      cellStyle: (params: any) => {
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: params.value === 'Y' ? '#4ade80' : '#f87171'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Margin',
      field: 'margin',
      width: 110,
      valueGetter: (params: any) => calculateMargin(params.data),
      valueFormatter: (params: any) => formatMargin(params.value),
      cellStyle: (params: any) => {
        const margin = params.value;
        let color = '#9ca3af'; // default gray
        if (margin !== null) {
          if (margin < 0) color = '#f87171'; // red
          else if (margin < 10) color = '#fb923c'; // orange
          else if (margin < 20) color = '#facc15'; // yellow
          else color = '#4ade80'; // green
        }
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'SDT',
      field: 'SDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'EDT',
      field: 'EDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Star',
      field: 'starred',
      width: 60,
      valueGetter: (params: any) => starredItems.has(params.data.id) ? '★' : '☆',
      cellStyle: (params: any) => {
        const isStarred = starredItems.has(params.data.id);
        return {
          color: isStarred ? '#facc15' : '#6b7280',
          textAlign: 'left' as const,
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

  // Apply quick filter when search term changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  // Custom cell renderer component for Item column (identical to AllItemsAGGrid)
  const ItemCellRenderer = (params: any) => {
    if (!params.data) return null;
    const stockcode = params.data.stockcode || '';
    const description = params.data.description || params.data.Description || '';
    
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

  return (
    <div className="space-y-6">
      {/* Updated header for Overstock */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Overstock Analysis</h3>
        <div className="text-sm text-gray-400">
          {data.overstockItems.length.toLocaleString()} overstock items
        </div>
      </div>

      {/* Search component */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* AG Grid Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {data.overstockItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No overstock items found</div>
              <div className="text-sm mt-1">Check your data upload or threshold settings</div>
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
                rowData={data.overstockItems}
                onGridReady={onGridReady}
                components={{
                  itemCellRenderer: ItemCellRenderer
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

// Legacy Overstock Analysis Component (will be replaced)
const OverstockAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
    nbp: string[];
    stockQty: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: [],
    stockQty: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
    stockQty: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: '',
    stockQty: ''
  });

  // Filter overstock items
  const overstockItems = useMemo(() => {
    return data.overstockItems
      .filter(item => {
        const matchesSearch = 
          item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(item.AVER ? 'Y' : 'N');

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes(
            (item.min_cost && item.min_cost > 0) ? 'Y' : 'N'
          );

        const matchesStockQtyFilter = columnFilters.stockQty.length === 0 || 
          columnFilters.stockQty.includes((item.currentStock || 0) > 0 ? 'In Stock' : 'OOS');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter && matchesStockQtyFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'stockValue':
            aValue = a.stockValue; bValue = b.stockValue; break;
          case 'averageCost':
            aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
          case 'monthsOfStock':
            aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
            bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
            break;
          case 'currentStock':
            aValue = a.currentStock; bValue = b.currentStock; break;
          case 'onOrder':
            aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
          case 'nbp':
            aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
            bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
            const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
            aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
            bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
            bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.AVER || 0; bValue = b.AVER || 0; break;
          case 'sdt':
            aValue = a.SDT || 0; bValue = b.SDT || 0; break;
          case 'edt':
            aValue = a.EDT || 0; bValue = b.EDT || 0; break;
          default:
            aValue = a.stockcode; bValue = b.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.overstockItems, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getUniqueVelocityCategories = () => {
    // Get velocity categories from all analyzed items for comprehensive filter options
    const categories = [...new Set(data.analyzedItems
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    // Get trend directions from all analyzed items for comprehensive filter options
    const trends = [...new Set(data.analyzedItems.map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Y', 'N'];
  };

  const getUniqueStockQtyValues = () => {
    return ['In Stock', 'OOS'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative text-sm`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Overstock Analysis</h3>
        <div className="text-sm text-gray-400">
          {overstockItems.length} overstock items
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Stock Qty', 'currentStock', 'stockQty', getUniqueStockQtyValues(), 'left')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort("monthsOfStock")}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('margin')}>
                    Margin {sortField === 'margin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'left')}
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {overstockItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-left text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              {(item.currentStock || 0).toLocaleString()}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">
                              Ringfenced: {(item.quantity_ringfenced || 0).toLocaleString()}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-left text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help text-red-400 font-semibold">
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
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(item.trendDirection)}`}>
                      {item.trendDirection === 'UP' ? '↑' : 
                       item.trendDirection === 'DOWN' ? '↓' : 
                       item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-left text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className={`p-3 text-left font-semibold text-sm ${getMarginColor(calculateMargin(item))}`}>
                      {formatMargin(calculateMargin(item))}
                    </td>
                    <td className="p-3 text-left text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-left text-blue-400 font-semibold text-sm">
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
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">
                                  {comp.name}: {formatCurrency(comp.price)}
                                  {comp.name === 'AAH2' && shouldShowAAHTrendTooltip(item) && (
                                    <div className="text-xs text-gray-300 mt-1 pl-2 border-l border-gray-600">
                                      {getAAHTrendTooltip(item).split('\n').map((line, lineIdx) => (
                                        <div key={lineIdx}>{line}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-left text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {overstockItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No overstock items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Now define InventoryAnalyticsContent after all the analysis components
const InventoryAnalyticsContent: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<ProcessedInventoryData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  // Add state for active metric filter
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Inject custom AG Grid filter styles
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = agGridFilterStyles;
    document.head.appendChild(styleSheet);
    
    return () => {
      try {
        document.head.removeChild(styleSheet);
      } catch (e) {
        // Style sheet might have been removed already
      }
    };
  }, []);

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
            // Full data for complete analysis
            analyzedItems: processedData.analyzedItems,
            overstockItems: processedData.overstockItems,
            priorityIssues: processedData.priorityIssues,
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
        description: `Analysed ${processedData.totalProducts} products with ${processedData.priorityIssues.length} priority issues identified.`
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

  // Handle metric card clicks for strategic insights
  const handleMetricCardClick = (metricType: string) => {
    setActiveMetricFilter(metricType);
    setSelectedTab('overview'); // Switch to overview tab to show filtered results
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
        
        // Add missing strategic metrics if they don't exist (for backward compatibility)
        if (parsedData.summaryStats && !parsedData.summaryStats.hasOwnProperty('outOfStockItems')) {
          parsedData.summaryStats.outOfStockItems = 0;
          parsedData.summaryStats.outOfStockFastMovers = 0;
          parsedData.summaryStats.marginOpportunityItems = 0;
          parsedData.summaryStats.marginOpportunityValue = 0;
          parsedData.summaryStats.costDisadvantageItems = 0;
          parsedData.summaryStats.costDisadvantageValue = 0;
          parsedData.summaryStats.stockRiskItems = 0;
          parsedData.summaryStats.stockRiskValue = 0;
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
                Optional: quantity_ringfenced, quantity_on_order, next_cost, competitor prices (Nupharm, AAH2, ETH_LIST, ETH_NET, LEXON2, AVER), tariffs (SDT, EDT)
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
      {/* Mobile: Compact header above metrics */}
      <div className="lg:hidden mb-4">
        <h1 className="text-sm font-medium text-white mb-1">Inventory Analysis Results</h1>
        <p className="text-xs text-gray-400 mb-3">{inventoryData.fileName} • {inventoryData.totalProducts.toLocaleString()} products analysed</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2 text-xs px-3 py-2">
            <Download className="h-3 w-3" />
            Export
          </Button>
          <Button onClick={handleNewUpload} className="flex items-center gap-2 text-xs px-3 py-2">
            <UploadCloud className="h-3 w-3" />
            New Upload
          </Button>
        </div>
      </div>

      {/* Desktop: Original header layout */}
      <div className="hidden lg:flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Inventory Analysis Results</h1>
          <p className="text-base text-gray-400">{inventoryData.fileName} • {inventoryData.totalProducts.toLocaleString()} products analysed</p>
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
        <div className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg opacity-60">
          <MetricCard 
            title="Total Products"
            value={inventoryData.summaryStats.totalProducts.toLocaleString()}
            subtitle={`${inventoryData.summaryStats.totalOverstockItems} overstocked`}
            icon={<Package className="h-5 w-5" />}
            iconPosition="right"
          />
        </div>
        
        <div className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg opacity-60">
          <MetricCard 
            title="Stock Value"
            value={formatCurrency(inventoryData.summaryStats.totalStockValue)}
            subtitle="Physical inventory"
            icon={<PoundSterling className="h-5 w-5" />}
            iconPosition="right"
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('on-order')} className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg">
          <MetricCard 
            title="On Order Value"
            value={formatCurrency(inventoryData.summaryStats.totalOnOrderValue)}
            subtitle={`${inventoryData.analyzedItems.reduce((sum, item) => sum + (item.quantity_on_order || 0), 0).toLocaleString()} on order`}
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            iconPosition="right"
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('overstock-value')} className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg">
          <MetricCard 
            title="Overstock Value"
            value={formatCurrency(inventoryData.summaryStats.totalOverstockStockValue)}
            subtitle={`${inventoryData.summaryStats.overstockPercentage.toFixed(1)}% of total`}
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            iconPosition="right"
            change={{
              value: `${inventoryData.summaryStats.overstockPercentage.toFixed(1)}%`,
              type: inventoryData.summaryStats.overstockPercentage > 20 ? 'decrease' : 'neutral'
            }}
          />
        </div>
      </div>

      {/* Summary Metrics - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div onClick={() => handleMetricCardClick('out-of-stock')} className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg">
          <MetricCard 
            title="Out of Stock"
            value={(inventoryData.summaryStats.outOfStockItems || 0).toLocaleString()}
            subtitle={(() => {
              const replenishableCount = inventoryData.analyzedItems.filter(item => 
                (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0 &&
                item.min_cost && item.min_cost > 0
              ).length;
              
              // Calculate monthly lost profit for replenishable items (using same logic as detailed view)
              const monthlyLostRevenue = inventoryData.analyzedItems
                .filter(item => (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0)
                .reduce((sum, item) => {
                  if (!item.min_cost || item.min_cost <= 0) return sum;
                  const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                  if (!lowestComp || lowestComp <= 0) return sum;
                  const monthlyUsage = item.averageUsage || item.packs_sold_avg_last_six_months || 0;
                  if (monthlyUsage <= 0) return sum;
                  const monthlyLostProfit = (lowestComp - item.min_cost) * monthlyUsage;
                  return sum + Math.max(0, monthlyLostProfit);
                }, 0);
              
              return `${replenishableCount} can be replenished (${formatCurrency(monthlyLostRevenue)}/month lost)`;
            })()}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            iconPosition="right"
            change={{
              value: inventoryData.analyzedItems.filter(item => 
                (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0 &&
                item.min_cost && item.min_cost > 0
              ).length > 0 ? 'Action Needed' : 'OK',
              type: inventoryData.analyzedItems.filter(item => 
                (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0 &&
                item.min_cost && item.min_cost > 0
              ).length > 0 ? 'increase' : 'neutral'
            }}
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('margin-opportunity')} className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg">
          <MetricCard 
            title="Margin Opportunities"
            value={(inventoryData.summaryStats.marginOpportunityItems || 0).toLocaleString()}
            subtitle={`${formatCurrency(inventoryData.summaryStats.marginOpportunityValue || 0)} potential`}
            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            iconPosition="right"
            change={{
              value: (inventoryData.summaryStats.marginOpportunityValue || 0) > 0 ? 'Revenue+' : 'None',
              type: (inventoryData.summaryStats.marginOpportunityValue || 0) > 0 ? 'increase' : 'neutral'
            }}
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('cost-disadvantage')} className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg">
          <MetricCard 
            title="Cost Disadvantage"
            value={(inventoryData.summaryStats.costDisadvantageItems || 0).toLocaleString()}
            subtitle={`${formatCurrency(inventoryData.summaryStats.costDisadvantageValue || 0)} at risk`}
            icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
            iconPosition="right"
            change={{
              value: (inventoryData.summaryStats.costDisadvantageValue || 0) > 0 ? 'Risk' : 'OK',
              type: (inventoryData.summaryStats.costDisadvantageValue || 0) > 0 ? 'decrease' : 'increase'
            }}
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('stock-risk')} className="hover:scale-105 hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer border border-transparent rounded-lg">
          <MetricCard 
            title="Stock Risk"
            value={(inventoryData.summaryStats.stockRiskItems || 0).toLocaleString()}
            subtitle={`${formatCurrency(inventoryData.summaryStats.stockRiskValue || 0)} <2wks supply`}
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            iconPosition="right"
            change={{
              value: (inventoryData.summaryStats.stockRiskItems || 0) > 0 ? 'Action Needed' : 'OK',
              type: (inventoryData.summaryStats.stockRiskItems || 0) > 0 ? 'decrease' : 'increase'
            }}
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-8">
        <TabsList className="flex flex-wrap lg:grid lg:grid-cols-6 w-full gap-1 lg:gap-0">
          <TabsTrigger value="overview" className="flex gap-2 flex-1 min-w-[120px] lg:min-w-0 justify-center">
            Overview
          </TabsTrigger>
          <TabsTrigger value="all" className="flex gap-1 flex-1 min-w-[120px] lg:min-w-0 justify-center">
            <span className="hidden sm:inline">All Items</span>
            <span className="sm:hidden">All</span>
            <Badge variant="secondary" className="bg-blue-500 text-white rounded-full text-xs">
              {inventoryData.totalProducts.toLocaleString()}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overstock" className="flex gap-1 flex-1 min-w-[120px] lg:min-w-0 justify-center">
            <span className="hidden sm:inline">Overstock</span>
            <span className="sm:hidden">Over</span>
            <Badge variant="secondary" className="bg-amber-500 text-white rounded-full text-xs">
              {inventoryData.summaryStats.totalOverstockItems}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex gap-1 flex-1 min-w-[120px] lg:min-w-0 justify-center">
            <span className="hidden sm:inline">Priority Issues</span>
            <span className="sm:hidden">Issues</span>
            <Badge variant="secondary" className="bg-red-500 text-white rounded-full text-xs">
              {inventoryData.priorityIssues.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex gap-1 flex-1 min-w-[120px] lg:min-w-0 justify-center">
            <span className="hidden sm:inline">Watchlist</span>
            <span className="sm:hidden">Watch</span>
            <Badge variant="secondary" className="bg-orange-500 text-white rounded-full text-xs">
              {inventoryData.summaryStats.watchlistCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="starred" className="flex gap-1 flex-1 min-w-[120px] lg:min-w-0 justify-center">
            <Star className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Starred</span>
            <span className="sm:hidden">Star</span>
            <Badge variant="secondary" className="bg-yellow-500 text-white rounded-full text-xs">
              {starredItems.size}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-12 lg:mt-6">
          <InventoryOverview 
            data={inventoryData} 
            activeMetricFilter={activeMetricFilter}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
            onClearFilter={() => setActiveMetricFilter(null)}
          />
        </TabsContent>
        
        <TabsContent value="all" className="space-y-6 mt-12 lg:mt-6">
          <AllItemsAGGrid 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="overstock" className="space-y-6 mt-12 lg:mt-6">
          <OverstockAGGrid 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="priority" className="space-y-6 mt-12 lg:mt-6">
          <PriorityIssuesAGGrid 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="watchlist" className="space-y-6 mt-12 lg:mt-6">
          <WatchlistAGGrid 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="starred" className="space-y-6 mt-12 lg:mt-6">
          <StarredItemsAGGrid 
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
const InventoryOverview: React.FC<{ 
  data: ProcessedInventoryData; 
  activeMetricFilter: string | null;
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
  onClearFilter: () => void; 
}> = ({ data, activeMetricFilter, onToggleStar, starredItems, onClearFilter }) => {
  // State for flip functionality - MUST be called before any conditional returns
  const [marginMatrixView, setMarginMatrixView] = useState<'chart' | 'table'>('chart');

  // Professional color palette for supplier analysis
  const SUPPLIER_COLORS: Record<string, string> = {
    'Our Price': '#22C55E',      // Green - we want this to stand out positively
    'Nupharm': '#3B82F6',       // Blue
    'AAH': '#F59E0B',           // Orange
    'Ethics (List)': '#8B5CF6', // Purple
    'Ethics (Net)': '#EC4899',  // Pink
    'Lexon': '#06B6D4',         // Cyan
    'No Data': '#6B7280'        // Gray
  };

  // Prepare data for Price Comparison Analysis (Multi-Line Chart)
  const priceComparisonData = useMemo(() => {
    const comparison: Array<{
      category: string;
      velocityCategory: number;
      ourPrice: number;
      lowestMarketPrice: number;
      averageMarketPrice: number;
      itemCount: number;
    }> = [];

    // Group by velocity category and calculate average prices
    const groupedData = data.analyzedItems.reduce((acc, item) => {
      if (typeof item.velocityCategory === 'number' && item.AVER && item.AVER > 0) {
        const key = item.velocityCategory;
        if (!acc[key]) {
          acc[key] = { 
            ourPrices: [], 
            lowestPrices: [], 
            allCompetitorPrices: [],
            itemCount: 0 
          };
        }
        
        // Add our price
        acc[key].ourPrices.push(item.AVER);
        acc[key].itemCount += 1;

        // Add lowest market price if available
        const lowestPrice = item.bestCompetitorPrice || item.lowestMarketPrice;
        if (lowestPrice && lowestPrice > 0) {
          acc[key].lowestPrices.push(lowestPrice);
        }

        // Collect all competitor prices for market average
        const suppliers = ['Nupharm', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2'];
        suppliers.forEach(supplier => {
          const price = item[supplier as keyof typeof item] as number;
          if (price && price > 0) {
            acc[key].allCompetitorPrices.push(price);
          }
        });
      }
      return acc;
    }, {} as Record<number, { 
      ourPrices: number[]; 
      lowestPrices: number[]; 
      allCompetitorPrices: number[];
      itemCount: number;
    }>);

    // Calculate averages for each velocity category
    Object.entries(groupedData).forEach(([category, groupData]) => {
      const catNum = parseInt(category);
      
      const ourAvgPrice = groupData.ourPrices.length > 0 
        ? groupData.ourPrices.reduce((sum, price) => sum + price, 0) / groupData.ourPrices.length 
        : 0;

      const lowestAvgPrice = groupData.lowestPrices.length > 0 
        ? groupData.lowestPrices.reduce((sum, price) => sum + price, 0) / groupData.lowestPrices.length 
        : 0;

      const marketAvgPrice = groupData.allCompetitorPrices.length > 0 
        ? groupData.allCompetitorPrices.reduce((sum, price) => sum + price, 0) / groupData.allCompetitorPrices.length 
        : 0;

      if (ourAvgPrice > 0) {
        // Calculate total stock value for this group using the main data reference
        const stockValue = data.analyzedItems
          .filter(item => typeof item.velocityCategory === 'number' && item.velocityCategory === catNum)
          .reduce((sum, item) => sum + (item.stockValue || 0), 0);

        const comparisonItem = {
          category: `Group ${catNum}`,
          velocityCategory: catNum,
          ourPrice: ourAvgPrice,
          lowestMarketPrice: lowestAvgPrice || ourAvgPrice, // Fallback to our price if no competitor data
          averageMarketPrice: marketAvgPrice || ourAvgPrice, // Fallback to our price if no competitor data
          itemCount: groupData.itemCount,
          stockValue: stockValue
        };
        
        comparison.push(comparisonItem as any);
      }
    });

    return comparison.sort((a, b) => a.velocityCategory - b.velocityCategory);
  }, [data.analyzedItems]);

  // Prepare data for Supplier Split Analysis (Strict Wins Only)
  const supplierSplitData = useMemo(() => {
    const supplierCounts: Record<string, number> = {
      'Our Price': 0,
      'Nupharm': 0,
      'AAH': 0,
      'Eth (List)': 0,
      'Eth (Net)': 0,
      'Lexon': 0,
      'No Data': 0
    };

    // Clean supplier name mapping
    const supplierMapping: Record<string, string> = {
      'AAH2': 'AAH',
      'ETH_LIST': 'Eth (List)',
      'ETH_NET': 'Eth (Net)',
      'LEXON2': 'Lexon',
      'Nupharm': 'Nupharm'
    };

    // For each item, only count STRICT wins (no ties)
    data.analyzedItems.forEach(item => {
      const competitors = ['Nupharm', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2'];
      
      // Check if we have our price
      if (item.AVER && item.AVER > 0) {
        // Get all valid competitor prices
        const competitorPrices: Array<{ source: string; price: number }> = [];
        competitors.forEach(supplier => {
          const price = item[supplier as keyof typeof item] as number;
          if (price && price > 0) {
            const cleanName = supplierMapping[supplier] || supplier;
            competitorPrices.push({ source: cleanName, price });
          }
        });

        if (competitorPrices.length > 0) {
          // Find the lowest competitor price
          const lowestCompetitorPrice = Math.min(...competitorPrices.map(c => c.price));
          
          // Check if we strictly win (our price < lowest competitor)
          if (item.AVER < lowestCompetitorPrice) {
            supplierCounts['Our Price'] += 1;
          } else {
            // Find which competitor has the lowest price (strict wins only)
            const lowestCompetitor = competitorPrices.find(c => c.price === lowestCompetitorPrice);
            
            // Only count if this competitor is strictly better than our price
            if (lowestCompetitor && lowestCompetitor.price < item.AVER) {
              supplierCounts[lowestCompetitor.source] += 1;
            } else {
              // It's a tie or we only have our price - count as no clear winner
              supplierCounts['No Data'] += 1;
            }
          }
        } else {
          // No competitor data available
          supplierCounts['No Data'] += 1;
        }
      } else {
        // No pricing data available
        supplierCounts['No Data'] += 1;
      }
    });

    // Convert to pie chart data format with better colors
    const pieData = Object.entries(supplierCounts)
      .filter(([_, count]) => count > 0)
      .map(([supplier, count]) => ({
        name: supplier,
        value: count,
        percentage: ((count / data.analyzedItems.length) * 100).toFixed(1)
      }));

    return pieData;
  }, [data.analyzedItems]);

  // Prepare data for Margin Opportunity Matrix (Heat Map Style) - REAL opportunities only
  const marginOpportunityData = useMemo(() => {
    const opportunities: Array<{
      category: string;
      opportunityValue: number;
      itemCount: number;
      averageMargin: number;
      priority: 'Critical' | 'High' | 'Medium' | 'Low';
      color: string;
    }> = [];

    // Group by velocity and calculate REAL margin opportunities
    const grouped = data.analyzedItems.reduce((acc, item) => {
      // Must have a velocity category
      if (typeof item.velocityCategory !== 'number') return acc;
      
      // Must have min_cost available (suppliers have stock)
      if (!item.min_cost || item.min_cost <= 0) return acc;
      
      // Calculate lowest competitor price
      const competitors = ['AAH', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2', 'Nupharm'];
      const competitorPrices = competitors
        .map(comp => item[comp as keyof typeof item] as number)
        .filter(price => price && price > 0);
      
      if (competitorPrices.length === 0) return acc;
      
      const lowestCompPrice = Math.min(...competitorPrices);
      
      // Only include if min_cost < lowest competitor price (real arbitrage opportunity)
      if (item.min_cost < lowestCompPrice) {
        const marginOpportunity = ((lowestCompPrice - item.min_cost) / item.min_cost) * 100;
        
        // Only include if > 5% margin opportunity
        if (marginOpportunity > 5) {
          const key = item.velocityCategory <= 2 ? 'Ultra Fast' :
                     item.velocityCategory <= 4 ? 'Fast' : 'Slow';
          
          if (!acc[key]) {
            acc[key] = { totalOpportunity: 0, items: 0, margins: [] };
          }

          // Calculate opportunity value based on buying at min_cost and selling at competitor price
          const potentialRevenue = lowestCompPrice * (item.quantity_available || 0);
          const currentCost = item.min_cost * (item.quantity_available || 0);
          const opportunityValue = potentialRevenue - currentCost;
          
          acc[key].totalOpportunity += opportunityValue;
          acc[key].items += 1;
          acc[key].margins.push(marginOpportunity);
        }
      }
      return acc;
    }, {} as Record<string, { totalOpportunity: number; items: number; margins: number[] }>);

    // Create opportunity data with priority classification
    Object.entries(grouped).forEach(([category, data]) => {
      const avgMargin = data.margins.reduce((sum, m) => sum + m, 0) / data.margins.length;
      
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
      let color = '#06B6D4';

      // Priority based on opportunity value and velocity
      if (data.totalOpportunity > 100000 && category === 'Ultra Fast') {
        priority = 'Critical';
        color = '#DC2626'; // Dark red
      } else if (data.totalOpportunity > 50000 || category === 'Ultra Fast') {
        priority = 'High';
        color = '#EF4444'; // Red
      } else if (data.totalOpportunity > 25000) {
        priority = 'Medium';
        color = '#F59E0B'; // Orange
      } else {
        priority = 'Low';
        color = '#10B981'; // Green
      }

      opportunities.push({
        category,
        opportunityValue: data.totalOpportunity,
        itemCount: data.items,
        averageMargin: avgMargin,
        priority,
        color
      });
    });

    return opportunities.sort((a, b) => b.opportunityValue - a.opportunityValue);
  }, [data.analyzedItems]);

  // Get margin opportunity items for table view - REAL opportunities only
  const marginOpportunityItems = useMemo(() => {
    return data.analyzedItems.filter(item => {
      // Must have a velocity category
      if (typeof item.velocityCategory !== 'number') return false;
      
      // Must have min_cost available (suppliers have stock)
      if (!item.min_cost || item.min_cost <= 0) return false;
      
      // Calculate lowest competitor price
      const competitors = ['AAH', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2', 'Nupharm'];
      const competitorPrices = competitors
        .map(comp => item[comp as keyof typeof item] as number)
        .filter(price => price && price > 0);
      
      if (competitorPrices.length === 0) return false;
      
      const lowestCompPrice = Math.min(...competitorPrices);
      
      // Only include if min_cost < lowest competitor price (real arbitrage opportunity)
      const isRealOpportunity = item.min_cost < lowestCompPrice;
      
      // Calculate margin opportunity percentage
      if (isRealOpportunity) {
        const marginOpportunity = ((lowestCompPrice - item.min_cost) / item.min_cost) * 100;
        // Store this for sorting - add it to the item temporarily
        (item as any).realMarginOpportunity = marginOpportunity;
        return marginOpportunity > 5; // Only include if > 5% margin opportunity
      }
      
      return false;
    }).sort((a, b) => ((b as any).realMarginOpportunity || 0) - ((a as any).realMarginOpportunity || 0));
  }, [data.analyzedItems]);

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // If a metric filter is active, show filtered data table
  if (activeMetricFilter) {
    return <MetricFilteredView 
      data={data} 
      filterType={activeMetricFilter}
      onToggleStar={onToggleStar}
      starredItems={starredItems}
      onClearFilter={onClearFilter}
    />;
  }

  // Enhanced overview with modern analytics
  return (
    <div className="space-y-6">
      {/* Price Comparison Analysis - Strategic Pricing Framework */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Price Comparison Analysis
          </CardTitle>
          <p className="text-sm text-gray-400">
            Compare our pricing against market lowest and average by velocity category
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={priceComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="category" 
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              {/* Left Y-Axis for Prices */}
              <YAxis 
                yAxisId="price"
                stroke="#9CA3AF"
                tickFormatter={(value) => `£${value.toFixed(2)}`}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                allowDecimals={true}
              />
              {/* Right Y-Axis for Stock Values */}
              <YAxis 
                yAxisId="stock"
                orientation="right"
                stroke="#374151"
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => {
                  if (name === 'stockValue') return [`£${(value as number / 1000).toFixed(0)}k`, 'Stock Value'];
                  const price = `£${(value as number).toFixed(2)}`;
                  if (name === 'ourPrice') return [price, 'Our Average Price'];
                  if (name === 'lowestMarketPrice') return [price, 'Lowest Market Price'];
                  if (name === 'averageMarketPrice') return [price, 'Average Market Price'];
                  return [price, name];
                }}
                labelFormatter={(label) => {
                  const item = priceComparisonData.find(d => d.category === label);
                  return `${label} (${item?.itemCount || 0} items)`;
                }}
              />
              
              {/* Background Stock Value Bars - Almost Transparent */}
              <Bar 
                yAxisId="stock"
                dataKey="stockValue" 
                fill="#374151"
                fillOpacity={0.4}
                stroke="none"
                name="stockValue"
                maxBarSize={50}
              />
              
              {/* Our Price Line - Blue */}
              <Line 
                yAxisId="price"
                type="monotone"
                dataKey="ourPrice" 
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#3B82F6' }}
                name="ourPrice"
              />
              
              {/* Lowest Market Price Line - Green */}
              <Line 
                yAxisId="price"
                type="monotone"
                dataKey="lowestMarketPrice" 
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#10B981' }}
                name="lowestMarketPrice"
              />
              
              {/* Average Market Price Line - Orange */}
              <Line 
                yAxisId="price"
                type="monotone"
                dataKey="averageMarketPrice" 
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#F59E0B' }}
                name="averageMarketPrice"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Our Average Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Lowest Market Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-300">Average Market Price</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Split Analysis */}
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Competitive Positioning Analysis</CardTitle>
            <p className="text-sm text-gray-400">
              Market share of lowest prices - who wins each product line?
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={supplierSplitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#1F2937"
                  strokeWidth={2}
                >
                  {supplierSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SUPPLIER_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value, name) => {
                    const percentage = supplierSplitData.find(d => d.name === name)?.percentage || '0';
                    return [`${value} items (${percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {supplierSplitData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: SUPPLIER_COLORS[entry.name] || '#6B7280' }}
                  ></div>
                  <span className="text-gray-300">{entry.name}: {entry.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Margin Opportunity Matrix with Flip */}
        <Card className="border border-white/10 bg-gradient-to-br from-gray-950/60 to-gray-900/40 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <TrendingUp className="h-6 w-6 text-orange-400" />
                  Real Margin Opportunities
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {marginMatrixView === 'chart' 
                    ? 'Products where suppliers have stock & our cost < competitor prices'
                    : `${marginOpportunityItems.length} actionable opportunities where we can source below market price`
                  }
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMarginMatrixView(marginMatrixView === 'chart' ? 'table' : 'chart')}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {marginMatrixView === 'chart' ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={marginOpportunityData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="category" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
                        return `£${value}`;
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                      }}
                      formatter={(value, name) => {
                        if (name === 'opportunityValue') {
                          const val = value as number;
                          const formatted = val >= 1000000 ? `£${(val / 1000000).toFixed(1)}M` :
                                          val >= 1000 ? `£${(val / 1000).toFixed(0)}k` :
                                          `£${val}`;
                          return [formatted, 'Opportunity Value'];
                        }
                        if (name === 'averageMargin') return [`${(value as number).toFixed(1)}%`, 'Avg Margin Opportunity'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const item = marginOpportunityData.find(d => d.category === label);
                        return `${label} (${item?.priority} Priority - ${item?.itemCount} items)`;
                      }}
                    />
                    <Bar 
                      dataKey="opportunityValue" 
                      fill="#8884d8"
                      name="opportunityValue"
                      radius={[4, 4, 0, 0]}
                    >
                      {marginOpportunityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">Low</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="max-h-80 overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead className="sticky top-0 bg-gray-900/90 backdrop-blur">
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-300 font-medium min-w-32">Product</th>
                      <th className="text-center p-2 text-gray-300 font-medium">Group</th>
                      <th className="text-left p-2 text-gray-300 font-medium">Min Cost</th>
                      <th className="text-left p-2 text-gray-300 font-medium">Our Price</th>
                      <th className="text-left p-2 text-gray-300 font-medium">Lowest Comp</th>
                      <th className="text-left p-2 text-gray-300 font-medium">Margin Opp</th>
                      <th className="text-center p-2 text-gray-300 font-medium">Market Rank</th>
                      <th className="text-left p-2 text-gray-300 font-medium">Stock Value</th>
                      <th className="text-center p-2 text-gray-300 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marginOpportunityItems.slice(0, 50).map((item, index) => {
                      const velocityGroup = typeof item.velocityCategory === 'number' && item.velocityCategory <= 2 ? 'Ultra Fast' :
                                           typeof item.velocityCategory === 'number' && item.velocityCategory <= 4 ? 'Fast' : 'Slow';
                      const priority = (item.stockValue || 0) > 50000 && velocityGroup === 'Ultra Fast' ? 'Critical' :
                                      (item.stockValue || 0) > 25000 || velocityGroup === 'Ultra Fast' ? 'High' :
                                      (item.stockValue || 0) > 10000 ? 'Medium' : 'Low';
                      const priorityColor = priority === 'Critical' ? 'text-red-400' :
                                           priority === 'High' ? 'text-red-300' :
                                           priority === 'Medium' ? 'text-orange-400' : 'text-green-400';
                      
                      // Calculate competitive data
                      const minCost = item.min_cost || 0; // What suppliers charge us
                      const ourPrice = item.AVER || 0; // What we sell for
                      const competitors = ['AAH', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2', 'Nupharm'];
                      const competitorPrices = competitors
                        .map(comp => item[comp as keyof typeof item] as number)
                        .filter(price => price && price > 0);
                      
                      const lowestCompPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
                      const marginOpportunity = (item as any).realMarginOpportunity || 0;
                      
                      // Calculate current margin if we have both min cost and our price
                      const currentMargin = minCost > 0 && ourPrice > 0 ? 
                        ((ourPrice - minCost) / minCost * 100) : 0;
                      
                      // Calculate market rank
                      const allPrices = ourPrice > 0 ? [ourPrice, ...competitorPrices] : competitorPrices;
                      const sortedPrices = [...allPrices].sort((a, b) => a - b);
                      const ourRank = ourPrice > 0 ? sortedPrices.indexOf(ourPrice) + 1 : 0;
                      const totalCompetitors = allPrices.length;
                      
                      return (
                        <tr key={item.stockcode} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="p-2">
                            <div className="font-medium text-white text-xs">{item.stockcode}</div>
                            <div className="text-gray-400 text-xs truncate max-w-32">{item.description}</div>
                          </td>
                          <td className="text-center p-2 text-gray-300 text-xs">{velocityGroup}</td>
                          <td className="text-left p-2 text-green-400 text-xs font-medium" title="Supplier/Manufacturer Price">
                            {minCost > 0 ? `£${minCost.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="text-left p-2 text-blue-400 text-xs font-medium" title={`Current Margin: ${currentMargin.toFixed(1)}%`}>
                            {ourPrice > 0 ? `£${ourPrice.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="text-left p-2 text-red-400 text-xs font-medium" title="Cheapest Competitor Price">
                            {lowestCompPrice > 0 ? `£${lowestCompPrice.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="text-left p-2 font-medium text-orange-400 text-xs" title="Potential margin if we price just below lowest competitor">
                            {marginOpportunity.toFixed(1)}%
                          </td>
                          <td className="text-center p-2 text-xs">
                            {ourRank > 0 && totalCompetitors > 0 ? (
                              <span className={`font-medium ${
                                ourRank === 1 ? 'text-green-400' :
                                ourRank === 2 ? 'text-yellow-400' :
                                ourRank === 3 ? 'text-orange-400' : 'text-red-400'
                              }`}>
                                {ourRank}/{totalCompetitors}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="text-left p-2 text-gray-300 text-xs">
                            {(item.stockValue || 0) >= 1000 ? `£${((item.stockValue || 0) / 1000).toFixed(0)}k` : `£${(item.stockValue || 0).toFixed(0)}`}
                          </td>
                          <td className={`text-center p-2 text-xs font-medium ${priorityColor}`}>
                            {priority}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {marginOpportunityItems.length > 50 && (
                  <div className="text-center text-gray-400 text-xs mt-2">
                    Showing top 50 of {marginOpportunityItems.length} opportunities
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Summary */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Strategic Insights Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {priceComparisonData.filter(item => item.ourPrice <= item.lowestMarketPrice).length}
              </div>
              <div className="text-sm text-gray-300">Competitive Categories</div>
              <div className="text-xs text-gray-400">Categories where we match/beat market</div>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {(supplierSplitData.find(item => item.name === 'Our Price')?.percentage || '0')}%
              </div>
              <div className="text-sm text-gray-300">Our Market Leadership</div>
              <div className="text-xs text-gray-400">Items where we have lowest price</div>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {formatCurrency(marginOpportunityData.reduce((sum, item) => sum + item.opportunityValue, 0))}
              </div>
              <div className="text-sm text-gray-300">Margin Opportunity</div>
              <div className="text-xs text-gray-400">Potential additional revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Metric Filtered AG Grid Component
const MetricFilteredAGGrid: React.FC<{
  data: ProcessedInventoryData;
  filterType: string;
  onToggleStar: (id: string) => void;
  starredItems: Set<string>;
  filteredItems: any[];
  onGridFilterChange?: (filteredData: any[]) => void;
}> = ({ data, filterType, onToggleStar, starredItems, filteredItems, onGridFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Handle filter changes from AG Grid
  const handleFilterChanged = useCallback(() => {
    if (gridApi && onGridFilterChange) {
      const filteredData: any[] = [];
      gridApi.forEachNodeAfterFilter(node => {
        if (node.data) {
          filteredData.push(node.data);
        }
      });
      console.log('AG Grid filtered data count:', filteredData.length); // Debug log
      onGridFilterChange(filteredData);
    }
  }, [gridApi, onGridFilterChange]);

  // Format currency function  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return '#9ca3af';
    if (margin < 0) return '#f87171';
    if (margin < 10) return '#fb923c';
    if (margin < 20) return '#facc15';
    return '#4ade80';
  };

  // Column definitions for AG Grid - matches the metric filtered view table
  const columnDefs: ColDef[] = [
    {
      headerName: 'Watch',
      field: 'watchlist',
      pinned: 'left',
      width: 80,
      valueFormatter: (params: any) => params.value || '−',
      cellClass: 'text-center',
      cellStyle: (params: any) => {
        const watchlist = params.value || '';
        const hasWarning = watchlist.includes('⚠️') || watchlist.includes('❗');
        return {
          textAlign: 'center !important' as const,
          color: hasWarning ? '#fb923c' : '#6b7280',
          fontSize: '16px'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Item',
      field: 'stockcode',
      pinned: 'left',
      width: 300,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Group',
      field: 'velocityCategory',
      width: 90,
      valueFormatter: (params: any) => {
        const category = params.value;
        return typeof category === 'number' ? category.toString() : 'N/A';
      },
      cellStyle: (params: any) => {
        const category = params.value;
        let color = '#9ca3af';
        if (typeof category === 'number') {
          if (category <= 2) color = '#4ade80';
          else if (category <= 4) color = '#facc15';
          else color = '#f87171';
        }
        return {
          textAlign: 'center !important' as const,
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock £',
      field: 'stockValue',
      width: 110,
      valueFormatter: (params: any) => {
        const value = params.value || 0;
        return formatCurrency(value);
      },
      cellClass: 'text-left text-white',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Stock Qty',
      field: 'currentStock',
      width: 110,
      valueGetter: (params: any) => params.data.currentStock || params.data.stock || 0,
      valueFormatter: (params: any) => params.value.toLocaleString(),
      tooltipValueGetter: (params: any) => {
        const ringfenced = params.data.quantity_ringfenced || 0;
        return `RF: ${ringfenced.toLocaleString()}`;
      },
      cellStyle: (params: any) => {
        const currentStock = params.value || 0;
        const ringfenced = params.data.quantity_ringfenced || 0;
        const ringfencedPercent = currentStock > 0 ? Math.min((ringfenced / currentStock) * 100, 100) : 0;
        
        let backgroundImage = 'none';
        if (ringfencedPercent > 0) {
          let fillColor = '#fbbf24';
          if (ringfencedPercent >= 25 && ringfencedPercent < 50) fillColor = '#f97316';
          else if (ringfencedPercent >= 50 && ringfencedPercent < 75) fillColor = '#dc2626';
          else if (ringfencedPercent >= 75) fillColor = '#991b1b';
          backgroundImage = `linear-gradient(to top, ${fillColor}15 0%, ${fillColor}15 ${ringfencedPercent}%, transparent ${ringfencedPercent}%, transparent 100%)`;
        }
        
        return {
          textAlign: 'left' as const,
          color: '#d1d5db',
          backgroundImage: backgroundImage,
          paddingLeft: '8px'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'On Order',
      field: 'quantity_on_order',
      width: 110,
      valueFormatter: (params: any) => (params.value || 0).toLocaleString(),
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Usage',
      field: 'averageUsage',
      width: 100,
      valueGetter: (params: any) => {
        const item = params.data;
        return item?.averageUsage || item?.packs_sold_avg_last_six_months;
      },
      valueFormatter: (params: any) => {
        const usage = params.value;
        return usage ? `${usage.toFixed(0)}` : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const last30Days = item?.packs_sold_last_30_days;
        const revaLast30Days = item?.packs_sold_reva_last_30_days;
        
        let tooltip = '';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `Last 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          if (tooltip) tooltip += '\n';
          tooltip += `Reva Usage: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip || 'No recent usage data available';
      },
      cellClass: 'text-left text-gray-300',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Months',
      field: 'monthsOfStock',
      width: 90,
      valueFormatter: (params: any) => {
        const months = params.value;
        return months === 999.9 ? '∞' : months ? months.toFixed(1) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const usage = item?.averageUsage || item?.packs_sold_avg_last_six_months;
        const last30Days = item?.packs_sold_last_30_days;
        const revaLast30Days = item?.packs_sold_reva_last_30_days;
        
        let tooltip = usage ? `${usage.toFixed(0)} packs/month (6mo avg)` : 'No usage data (6mo avg)';
        
        if (last30Days !== undefined && last30Days !== null && !isNaN(last30Days)) {
          tooltip += `\nLast 30 days: ${Number(last30Days).toFixed(0)} packs`;
        }
        
        if (revaLast30Days !== undefined && revaLast30Days !== null && !isNaN(revaLast30Days)) {
          tooltip += `\nReva last 30 days: ${Number(revaLast30Days).toFixed(0)} packs`;
        }
        
        return tooltip;
      },
      cellStyle: (params: any) => {
        const months = params.value;
        return {
          textAlign: 'left' as const,
          fontWeight: months && months > 6 ? 'bold' : 'normal',
          color: months && months > 6 ? '#f87171' : '#d1d5db'
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Avg Cost',
      field: 'avg_cost',
      width: 110,
      valueGetter: (params: any) => getDisplayedAverageCost(params.data),
      valueFormatter: (params: any) => {
        const value = params.value;
        return value ? formatCurrency(value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        return shouldShowAverageCostTooltip(params.data) ? getAverageCostTooltip(params.data) : null;
      },
      cellClass: 'text-left text-gray-300 font-bold',
      sortable: true,
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Buying Trend',
      field: 'trendDirection',
      width: 110,
      valueFormatter: (params: any) => {
        const trend = params.value;
        return trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : trend === 'STABLE' ? '−' : '?';
      },
      cellStyle: (params: any) => {
        const trend = params.value;
        let color = '#9ca3af';
        switch (trend) {
          case 'UP': color = '#4ade80'; break;
          case 'DOWN': color = '#f87171'; break;
          case 'STABLE': color = '#facc15'; break;
        }
        return {
          textAlign: 'center !important' as const,
          fontSize: '18px',
          fontWeight: 'bold',
          color: color
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Price',
      field: 'AVER',
      width: 110,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : 'N/A',
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const mclean = item?.MCLEAN && item.MCLEAN > 0 ? formatCurrency(item.MCLEAN) : 'N/A';
        const apple = item?.APPLE && item.APPLE > 0 ? formatCurrency(item.APPLE) : 'N/A';
        const davidson = item?.DAVIDSON && item.DAVIDSON > 0 ? formatCurrency(item.DAVIDSON) : 'N/A';
        const reva = item?.reva && item.reva > 0 ? formatCurrency(item.reva) : 'N/A';
        return `MCLEAN: ${mclean}\nAPPLE: ${apple}\nDAVIDSON: ${davidson}\nREVA: ${reva}`;
      },
      cellClass: 'text-left text-purple-400 font-bold',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Margin',
      field: 'margin',
      width: 110,
      valueGetter: (params: any) => calculateMargin(params.data),
      valueFormatter: (params: any) => formatMargin(params.value),
      cellStyle: (params: any) => {
        const margin = params.value;
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: getMarginColor(margin)
        };
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'NBP',
      field: 'min_cost',
      width: 110,
      valueFormatter: (params: any) => {
        const minCost = params.value;
        return minCost && minCost > 0 ? formatCurrency(minCost) : 'OOS';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const nextCost = item?.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A';
        const minCost = item?.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A';
        const lastPoCost = item?.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A';
        return `Next Cost: ${nextCost}\nMin Cost: ${minCost}\nLast PO Cost: ${lastPoCost}`;
      },
      cellStyle: { textAlign: 'left' as const, color: '#3b82f6', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Winning',
      field: 'winning',
      width: 90,
      valueGetter: (params: any) => {
        const item = params.data;
        const lowestComp = item?.bestCompetitorPrice || item?.lowestMarketPrice || item?.Nupharm || item?.AAH2 || item?.LEXON2;
        const isWinning = item?.AVER && lowestComp && item.AVER < lowestComp;
        return isWinning ? 'Y' : 'N';
      },
      cellStyle: (params: any) => {
        return {
          textAlign: 'left' as const,
          fontWeight: 'bold',
          color: params.value === 'Y' ? '#4ade80' : '#f87171'
        };
      },
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Market',
      field: 'lowestComp',
      width: 110,
      valueGetter: (params: any) => {
        const item = params.data;
        return item?.bestCompetitorPrice || item?.lowestMarketPrice || item?.Nupharm || item?.AAH2 || item?.LEXON2 || 0;
      },
      valueFormatter: (params: any) => {
        return params.value > 0 ? formatCurrency(params.value) : 'N/A';
      },
      tooltipValueGetter: (params: any) => {
        const item = params.data;
        const competitors = [
          { name: 'PHX', price: item?.Nupharm },
          { name: 'AAH', price: item?.AAH2 },
          { name: 'ETHN', price: item?.ETH_NET },
          { name: 'LEX', price: item?.LEXON2 }
        ].filter(comp => comp.price && comp.price > 0)
         .sort((a, b) => a.price - b.price);
        
        if (competitors.length === 0) {
          return 'No competitor pricing available';
        }
        
        // Build tooltip with competitor prices and trend information
        let tooltipLines = competitors.map(comp => {
          let line = `${comp.name}: ${formatCurrency(comp.price)}`;
          
          // Add trend information for each competitor if available
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'PHX' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'ETHN' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          } else if (comp.name === 'LEX' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += ` - ${trendInfo}`;
            }
          }
          
          return line;
        });
        
        return tooltipLines.join('\n');
      },
      cellStyle: { textAlign: 'left' as const, color: '#60a5fa', fontWeight: 'bold' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'SDT',
      field: 'SDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'EDT',
      field: 'EDT',
      width: 90,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-',
      cellStyle: { textAlign: 'left' as const, color: '#d1d5db' },
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      suppressSizeToFit: true
    },
    {
      headerName: 'Star',
      field: 'starred',
      width: 60,
      valueGetter: (params: any) => starredItems.has(params.data.id) ? '★' : '☆',
      cellStyle: (params: any) => {
        const isStarred = starredItems.has(params.data.id);
        return {
          color: isStarred ? '#facc15' : '#6b7280',
          textAlign: 'left' as const,
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

  // Apply quick filter when search term changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);
  
  // Trigger filter change when filtered items change (for initial load)
  useEffect(() => {
    if (gridApi && onGridFilterChange) {
      console.log('Filtered items changed, triggering handleFilterChanged'); // Debug log
      // Small delay to ensure grid is updated
      setTimeout(() => handleFilterChanged(), 50);
    }
  }, [filteredItems, gridApi, onGridFilterChange, handleFilterChanged]);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
    
    // Set up filter change listener and initial data
    if (onGridFilterChange) {
      // Add multiple event listeners to catch all filter changes
      params.api.addEventListener('filterChanged', handleFilterChanged);
      params.api.addEventListener('sortChanged', handleFilterChanged);
      params.api.addEventListener('modelUpdated', handleFilterChanged);
      
      // Call immediately to set initial filtered data
      setTimeout(() => {
        console.log('Setting initial filtered data'); // Debug log
        handleFilterChanged();
      }, 100);
    }
  };

  // Custom cell renderer component for Item column
  const ItemCellRenderer = (params: any) => {
    if (!params.data) return null;
    const stockcode = params.data.stockcode || '';
    const description = params.data.description || params.data.Description || '';
    
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

  return (
    <div 
      className="ag-theme-alpine-dark" 
      style={{ 
        height: '600px', 
        width: '100%'
      }}
    >
      <AgGridReact
        columnDefs={columnDefs}
        rowData={filteredItems}
        onGridReady={onGridReady}
        onFilterChanged={handleFilterChanged}
        components={{
          itemCellRenderer: ItemCellRenderer
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
        quickFilterText={searchTerm}
      />
    </div>
  );
};

// New component to show filtered data when a metric card is clicked
const MetricFilteredView: React.FC<{
  data: ProcessedInventoryData;
  filterType: string;
  onToggleStar: (id: string) => void;
  starredItems: Set<string>;
  onClearFilter: () => void;
}> = ({ data, filterType, onToggleStar, starredItems, onClearFilter }) => {
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [gridFilteredData, setGridFilteredData] = useState<any[]>([]);
  
  // Debug effect to log when gridFilteredData changes
  useEffect(() => {
    console.log('Grid filtered data updated:', gridFilteredData.length, 'items');
  }, [gridFilteredData]);
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
    nbp: string[];
    stockQty: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: [],
    stockQty: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
    stockQty: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: '',
    stockQty: ''
  });

  // Get filtered items based on metric type
  const filteredItems = useMemo(() => {
    let filtered = data.analyzedItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = false;
      switch (filterType) {
        case 'out-of-stock':
          matchesFilter = (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0;
          break;
        case 'margin-opportunity':
          matchesFilter = item.lowestMarketPrice && item.avg_cost < (item.lowestMarketPrice * 0.9);
          break;
        case 'cost-disadvantage':
          matchesFilter = item.lowestMarketPrice && item.avg_cost > item.lowestMarketPrice;
          break;
        case 'stock-risk':
          matchesFilter = item.packs_sold_avg_last_six_months > 0 && 
                         (item.currentStock / item.packs_sold_avg_last_six_months) < 0.5;
          break;
        case 'on-order':
          matchesFilter = (item.quantity_on_order || 0) > 0;
          break;
        case 'overstock-value':
          matchesFilter = item.isOverstocked;
          break;
        default:
          matchesFilter = true;
      }

      // Apply column filters
      const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
        columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');
      
      const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
        columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

      const matchesWinningFilter = columnFilters.winning.length === 0 || 
        columnFilters.winning.includes(item.AVER ? 'Y' : 'N');

      const matchesNbpFilter = columnFilters.nbp.length === 0 || 
        columnFilters.nbp.includes(
          (item.min_cost && item.min_cost > 0) ? 'Available' : 'N/A'
        );

      const matchesStockQtyFilter = columnFilters.stockQty.length === 0 || 
        columnFilters.stockQty.includes((item.currentStock || 0) > 0 ? 'In Stock' : 'OOS');

      return matchesSearch && matchesFilter && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter && matchesStockQtyFilter;
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
          aValue = a.avg_cost || 0;
          bValue = b.avg_cost || 0;
          break;
        case 'currentStock':
          aValue = a.currentStock || 0;
          bValue = b.currentStock || 0;
          break;
        case 'onOrder':
          aValue = a.quantity_on_order || 0;
          bValue = b.quantity_on_order || 0;
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
        case 'winning':
          const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
          const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
          aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
          bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
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
  }, [data.analyzedItems, filterType, searchTerm, sortField, sortDirection, starredItems, columnFilters]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.analyzedItems.map(item => 
      typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A'
    ))];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.analyzedItems.map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
  };

  const getUniqueStockQtyValues = () => {
    return ['In Stock', 'OOS'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'center'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    
    return (
      <th className="text-center p-3 text-gray-300 relative text-sm">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
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

  // Calculate and format margin percentage
  const calculateMargin = (item: any): number | null => {
    if (!item.AVER || !item.avg_cost || item.AVER <= 0) {
      return null;
    }
    return ((item.AVER - item.avg_cost) / item.AVER) * 100;
  };

  const formatMargin = (margin: number | null): string => {
    if (margin === null) return 'N/A';
    return `${margin.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number | null): string => {
    if (margin === null) return 'text-gray-400';
    if (margin < 0) return 'text-red-400';
    if (margin < 10) return 'text-orange-400';
    if (margin < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getFilterTitle = () => {
    switch (filterType) {
      case 'out-of-stock': return 'Out of Stock Items';
      case 'margin-opportunity': return 'Margin Opportunity Items';
      case 'cost-disadvantage': return 'Cost Disadvantage Items';
      case 'stock-risk': return 'Stock Risk Items';
      case 'on-order': return 'On Order Items';
      case 'overstock-value': return 'Overstock Items';
      default: return 'Filtered Items';
    }
  };

  // Export function to convert filtered data to CSV
  const handleExport = () => {
    // Use grid filtered data if available, otherwise fall back to component filtered items
    const dataToExport = gridFilteredData.length > 0 ? gridFilteredData : filteredItems;
    
    console.log('Export - Grid filtered data:', gridFilteredData.length); // Debug log
    console.log('Export - Component filtered items:', filteredItems.length); // Debug log
    console.log('Export - Data to export:', dataToExport.length); // Debug log
    
    if (dataToExport.length === 0) {
      return;
    }

    // Define CSV headers
    const headers = [
      'Stock Code',
      'Description',
      'Group',
      'Stock Value (£)',
      'Stock Qty',
      'On Order',
      'Usage',
      'Months',
      'Avg Cost (£)',
      'NBP (£)',
      'Buying Trend',
      'Price (£)',
      'Margin (%)',
      'Winning',
      'Market (£)',
      'Market Trend'
    ];

    // Convert filtered data to CSV rows
    const csvRows = dataToExport.map(item => {
      const margin = calculateMargin(item);
      const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
      const nbp = item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost;
      const marketTrend = getMarketTrendDisplay(item);
      const winningStatus = getWinningStatus(item);
      
      return [
        item.stockcode || '',
        item.description || '',
        typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A',
        item.stockValue ? item.stockValue.toFixed(2) : '0.00',
        (item.currentStock || 0).toString(),
        (item.quantity_on_order || 0).toString(),
        item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'N/A',
        item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A',
        getDisplayedAverageCost(item) ? getDisplayedAverageCost(item)!.toFixed(2) : 'N/A',
        nbp && nbp > 0 ? nbp.toFixed(2) : 'N/A',
        item.trendDirection || 'N/A',
        item.AVER ? item.AVER.toFixed(2) : 'N/A',
        margin ? margin.toFixed(1) : 'N/A',
        winningStatus,
        lowestComp && lowestComp > 0 ? lowestComp.toFixed(2) : 'N/A',
        marketTrend
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date and filter type
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `${getFilterTitle().replace(/\s+/g, '_')}_${dateStr}.csv`;
    link.setAttribute('download', filename);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilterDescription = () => {
    switch (filterType) {
      case 'out-of-stock': return 'Items with 0 available, 0 ringfenced, and 0 on order';
      case 'margin-opportunity': return 'Items where our cost is >10% below lowest market price';
      case 'cost-disadvantage': return 'Items where our cost is above market low';
      case 'stock-risk': return 'Items with less than 2 weeks supply based on usage';
      case 'on-order': return 'Items with future commitments on order';
      case 'overstock-value': return 'Items with >6 months stock based on sales data';
      default: return 'Filtered view of inventory items';
    }
  };

  // Calculate summary stats for filtered items
  const filteredStats = useMemo(() => {
    let totalValue;
    
    if (filterType === 'out-of-stock') {
      // Calculate lost revenue opportunity for out-of-stock items that can be replenished
      totalValue = filteredItems.reduce((sum, item) => {
        // Only calculate for items with min_cost (can be replenished)
        if (!item.min_cost || item.min_cost <= 0) return sum;
        
        // Get lowest competitor price
        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
        if (!lowestComp || lowestComp <= 0) return sum;
        
        // Get average monthly usage
        const monthlyUsage = item.averageUsage || item.packs_sold_avg_last_six_months || 0;
        if (monthlyUsage <= 0) return sum;
        
        // Calculate monthly lost profit: (selling_price - cost) * monthly_usage
        const monthlyLostProfit = (lowestComp - item.min_cost) * monthlyUsage;
        return sum + Math.max(0, monthlyLostProfit); // Only add positive profits
      }, 0);
    } else {
      // Default calculation for other filter types
      totalValue = filteredItems.reduce((sum, item) => sum + (item.stockValue || 0), 0);
    }
    
    const fastMovers = filteredItems.filter(item => typeof item.velocityCategory === 'number' && item.velocityCategory <= 3);
    const potentialRevenue = filteredItems.reduce((sum, item) => {
      if (filterType === 'margin-opportunity' && item.lowestMarketPrice) {
        return sum + ((item.lowestMarketPrice - item.avg_cost) * (item.currentStock || 0));
      }
      return sum;
    }, 0);
    
    return {
      totalItems: filteredItems.length,
      totalValue,
      fastMovers: fastMovers.length,
      potentialRevenue
    };
  }, [filteredItems, filterType]);

  return (
    <div className="space-y-6">
      {/* Header with clear filter button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">{getFilterTitle()}</h2>
          <p className="text-gray-400">{getFilterDescription()}</p>
        </div>
        <Button variant="outline" onClick={onClearFilter} className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          Show All Overview
        </Button>
      </div>

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
            <div className="text-sm text-gray-400">
              {filterType === 'out-of-stock' ? 'Monthly Lost Profit' : 'Total Value'}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{filteredStats.fastMovers}</div>
            <div className="text-sm text-gray-400">Fast Movers (Cat 1-3)</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {filterType === 'margin-opportunity' ? formatCurrency(filteredStats.potentialRevenue) : 
               starredItems.size.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">
              {filterType === 'margin-opportunity' ? 'Potential Revenue' : 'Starred Items'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredStats.totalItems.toLocaleString()} items
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Filtered Data</h3>
          <p className="text-sm text-gray-400">Export the current filtered results</p>
        </div>
        <Button 
          onClick={handleExport}
          disabled={filteredItems.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4" />
          Export to CSV ({gridFilteredData.length > 0 ? gridFilteredData.length : filteredItems.length} items)
        </Button>
      </div>

      {/* Data Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          ) : (
            <MetricFilteredAGGrid
              data={data}
              filterType={filterType}
              onToggleStar={onToggleStar}
              starredItems={starredItems}
              filteredItems={filteredItems}
              onGridFilterChange={setGridFilteredData}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapper component
const InventoryAnalytics: React.FC = () => <InventoryAnalyticsContent />;

export default InventoryAnalytics; 


































