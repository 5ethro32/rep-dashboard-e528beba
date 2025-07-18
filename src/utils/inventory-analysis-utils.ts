import * as XLSX from 'xlsx';

// Core interfaces for inventory analysis
export interface InventoryItem {
  stockcode: string;
  description: string;
  quantity_available: number;
  quantity_ringfenced: number;
  quantity_on_order: number;
  packs_sold_avg_last_six_months: number;
  avg_cost: number;
  next_cost?: number;
  calculated_next_avg_cost?: number; // Column J - Calculated New Average Cost (blended cost when new stock on order)
  min_cost?: number;
  last_po_cost?: number;
  group: number; // Watchlist indicator (1 = problem line)
  // Competitor prices - ETH_NET now included in analysis
  Nupharm?: number;
  AAH2?: number;
  ETH_LIST?: number;
  ETH_NET?: number;
  LEXON2?: number;
  MCLEAN?: number;
  APPLE?: number;
  DAVIDSON?: number;
  AVER?: number; // Our selling price
  reva?: number; // Reva price
  eth_OOS?: string; // ETH Out of Stock indicator
  SDT?: number; // Scottish Drug Tariff
  EDT?: number; // English Drug Tariff
  packs_sold_last_30_days?: number; // Column M - Last 30 days sales
  packs_sold_reva_last_30_days?: number; // Column L - Reva last 30 days sales
  
  // Yesterday's prices for trend analysis
  AAH_yesterday?: number; // Column AU - Yesterday's AAH price
  Nupharm_yesterday?: number; // Column AO - Yesterday's Nupharm price (NU)
  ETH_NET_yesterday?: number; // Column AK - Yesterday's ETH NET price (ETH)
  LEXON2_yesterday?: number; // Column AR - Yesterday's LEXON price (LEXON)
  
  // Min Supplier field
  min_supplier?: string; // Column BM - Min Supplier information
  
  // Bin Location field
  binLocation?: string; // Bin location for warehouse optimization
  
  // Overstock Location fields
  overstockLocation1?: string;
  overstockLocation2?: string;
  overstockLocation3?: string;
}

export interface ProcessedInventoryItem extends InventoryItem {
  // Velocity analysis
  velocityRank: number | null;
  velocityCategory: 1 | 2 | 3 | 4 | 5 | 6 | 'N/A';
  
  // Stock calculations
  currentStock: number; // qty_available + qty_ringfenced
  totalStock: number; // current + on_order
  stock: number; // Alias for currentStock for UI compatibility
  monthsOfStock: number;
  isOverstocked: boolean;
  
  // Usage data
  averageUsage: number | null; // Monthly usage from packs_sold_avg_last_six_months
  
  // Valuations
  stockValue: number; // current stock * avg_cost
  onOrderValue: number; // qty_on_order * avg_cost
  totalPotentialValue: number; // total stock * avg_cost
  
  // NBP analysis
  nbp: number | null;
  nbpSource: 'next_cost' | 'min_cost' | 'last_po_cost' | 'none';
  nextBuyingPrice: number | null; // Alias for nbp for UI compatibility
  trendDirection: 'UP' | 'DOWN' | 'STABLE' | 'N/A';
  trendPercentage: string;
  
  // Competitive analysis
  lowestMarketPrice: number | null;
  bestCompetitorPrice: number | null; // Alias for lowestMarketPrice for UI compatibility
  marginVsLowest: number | null;
  pricingStrategy: 'Profitable' | 'Marginal' | 'Loss Required' | 'Unknown';
  competitorCount: number;
  
  // Competitor price trend analysis
  aahTrend: {
    current: number | null;
    yesterday: number | null;
    trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
    percentageChange: number | null;
    changeAmount: number | null;
  };
  
  nupharmTrend: {
    current: number | null;
    yesterday: number | null;
    trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
    percentageChange: number | null;
    changeAmount: number | null;
  };
  
  ethNetTrend: {
    current: number | null;
    yesterday: number | null;
    trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
    percentageChange: number | null;
    changeAmount: number | null;
  };
  
  lexonTrend: {
    current: number | null;
    yesterday: number | null;
    trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
    percentageChange: number | null;
    changeAmount: number | null;
  };
  
  // Flags and indicators
  watchlist: string;
  
  // Unique identifier
  id: string;
}

export interface InventorySummaryStats {
  totalProducts: number;
  totalStockValue: number;
  totalOnOrderValue: number;
  totalPotentialValue: number;
  totalOverstockStockValue: number;
  totalOverstockOnOrderValue: number;
  totalOverstockPotentialValue: number;
  totalOverstockItems: number;
  overstockPercentage: number;
  watchlistValue: number;
  watchlistCount: number;
  overstockWatchlistCount: number;
  overstockWatchlistValue: number;
  
  // New strategic metrics
  outOfStockItems: number;
  outOfStockFastMovers: number; // Velocity categories 1-3
  marginOpportunityItems: number;
  marginOpportunityValue: number; // Potential revenue impact
  costDisadvantageItems: number;
  costDisadvantageValue: number; // Total value at risk
  stockRiskItems: number; // <2 weeks supply
  stockRiskValue: number; // Value of at-risk stock
}

export interface VelocityBreakdown {
  category: number;
  itemCount: number;
  stockValue: number;
}

export interface TrendBreakdown {
  direction: string;
  itemCount: number;
  stockValue: number;
}

export interface StrategyBreakdown {
  strategy: string;
  itemCount: number;
  stockValue: number;
}

export interface PriorityIssue {
  id: string;
  type: 'HIGH_VALUE_OVERSTOCK_FAST_MOVER' | 'WATCHLIST_DECLINING_PRICE' | 'COMPETITIVE_DISADVANTAGE' | 'EXCESSIVE_MONTHS_STOCK';
  item: ProcessedInventoryItem;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  impactValue: number;
}

export interface ProcessedInventoryData {
  fileName: string;
  totalProducts: number;
  analyzedItems: ProcessedInventoryItem[];
  summaryStats: InventorySummaryStats;
  priorityIssues: PriorityIssue[];
  overstockItems: ProcessedInventoryItem[];
  velocityBreakdown: VelocityBreakdown[];
  trendBreakdown: TrendBreakdown[];
  strategyBreakdown: StrategyBreakdown[];
  // Raw data for reference
  rawData: InventoryItem[];
}

// Column mapping for dynamic Excel processing
const generateInventoryColumnMapping = (headers: string[]) => {
  const mapping: Record<string, string> = {};
  
  const columnVariations = {
    stockcode: ['stockcode', 'stock code', 'item code', 'product code', 'sku'],
    description: ['description', 'desc', 'product name', 'item name', 'product description'],
    quantity_available: ['quantity_available', 'qty available', 'available', 'in stock', 'stock'],
    quantity_ringfenced: ['quantity_ringfenced', 'qty ringfenced', 'ringfenced', 'reserved'],
    quantity_on_order: ['quantity_on_order', 'qty on order', 'on order', 'ordered'],
    packs_sold_avg_last_six_months: [
      'packs_sold_avg_last_six_months', 
      'packs sold avg last six months',
      'packs_sold_avg_last_6_months',
      'packs sold avg last 6 months',
      'monthly usage', 
      'avg monthly sales', 
      'usage',
      'six months usage',
      'avg_6_months',
      'sales_6_months',
      'monthly_sales',
      'avg_monthly_usage',
      'packs_sold_last_six_months',
      'sold_avg_last_six_months'
    ],
    avg_cost: ['avg_cost', 'average cost', 'cost', 'unit cost'],
    next_cost: ['next_cost', 'next cost', 'future cost', 'next buying price'],
    calculated_next_avg_cost: [
      'calculated_next_avg_cost', 
      'calculated next avg cost', 
      'calculated next average cost',
      'blended avg cost',
      'blended average cost',
      'weighted avg cost',
      'weighted average cost',
      'new avg cost',
      'new average cost'
    ],
    min_cost: ['min_cost', 'minimum cost', 'min price'],
    last_po_cost: ['last_po_cost', 'last po cost', 'last purchase cost', 'previous cost'],
    group: ['grp'],
    Nupharm: ['nupharm', 'nu pharm', 'nupharm price'],
    AAH2: ['aah2', 'aah 2', 'aah2 price'],
    ETH_LIST: ['eth_list', 'eth list', 'eth list price'],
    ETH_NET: ['eth_net', 'eth net', 'eth net price'],
    LEXON2: ['lexon2', 'lexon 2', 'lexon2 price'],
    MCLEAN: ['mclean', 'mc lean', 'mclean price'],
    APPLE: ['apple', 'apple price'],
    DAVIDSON: ['davidson', 'davidson price'],
    AVER: ['aver', 'our price', 'selling price', 'current price'],
    reva: ['reva', 'reva price'],
    eth_OOS: ['eth_oos', 'eth oos', 'eth out of stock', 'oos'],
    SDT: ['sdt', 'scottish drug tariff', 'scottish tariff', 'scotland tariff'],
    EDT: ['edt', 'english drug tariff', 'english tariff', 'england tariff'],
    packs_sold_last_30_days: [
      'packs_sold_last_30_days', 
      'packs sold last 30 days',
      'last 30 days',
      'last_30_days',
      '30 days sales',
      'thirty days sales',
      'M', // Column M
      'column M',
      'col M'
    ],
    packs_sold_reva_last_30_days: [
      'packs_sold_reva_last_30_days',
      'packs sold reva last 30 days', 
      'reva last 30 days',
      'reva_last_30_days',
      'reva 30 days',
      'L', // Column L
      'column L',
      'col L'
    ],
    // Yesterday's prices for trend analysis
    AAH_yesterday: [
      'aah', // Column AU - This is the key mapping
      'aah_yesterday',
      'aah yesterday', 
      'aah prev',
      'aah previous',
      'aah_prev',
      'AU', // Column AU directly
      'column AU',
      'col AU'
    ],
    Nupharm_yesterday: [
      'nu', // Column AO - This is the key mapping
      'nupharm_yesterday',
      'nupharm yesterday',
      'nu_yesterday',
      'nu yesterday',
      'AO', // Column AO directly
      'column AO',
      'col AO'
    ],
    ETH_NET_yesterday: [
      'eth', // Column AK - Updated to match your Excel structure  
      'eth_net_yesterday',
      'eth net yesterday',
      'eth_yesterday',
      'eth yesterday',
      'AK', // Column AK directly (was EK before)
      'column AK',
      'col AK'
    ],
    LEXON2_yesterday: [
      'lexon', // Column AR - This is the key mapping
      'lexon_yesterday',
      'lexon yesterday',
      'lexon2_yesterday',
      'lexon2 yesterday',
      'AR', // Column AR directly
      'column AR',
      'col AR'
    ],
    min_supplier: [
      'min supplier', // Column BM - Min Supplier
      'min_supplier',
      'minsupplier',
      'supplier',
      'min supplier name',
      'minimum supplier',
      'BM', // Column BM directly
      'column BM',
      'col BM'
    ],
    binLocation: [
      'binlocation', 'bin location', 'bin_location', 'location', 'bin', 'warehouse location',
      'picking location', 'storage location', 'shelf location', 'position'
    ]
  };
  
  // Find matches for each field
  for (const [field, variations] of Object.entries(columnVariations)) {
    const match = findColumnMatch(headers, variations);
    if (match) {
      mapping[field] = match;
    }
  }
  
  return mapping;
};

// Helper function to find column matches
const findColumnMatch = (headers: string[], possibleNames: string[]): string | null => {
  // Clean headers by trimming whitespace and normalizing
  const cleanHeaders = headers.map(h => ({ 
    original: h, 
    clean: h.toLowerCase().trim().replace(/\s+/g, ' ').replace(/_/g, ' ') 
  }));
  
  // First try exact matches (case insensitive, trimmed, underscores normalized)
  for (const { original, clean } of cleanHeaders) {
    for (const name of possibleNames) {
      const cleanName = name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/_/g, ' ');
      if (clean === cleanName) {
        return original;
      }
    }
  }
  
  // If no exact match, try partial matches
  for (const { original, clean } of cleanHeaders) {
    for (const name of possibleNames) {
      const cleanName = name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/_/g, ' ');
      if (clean.includes(cleanName) && cleanName.length > 3) {
        return original;
      }
      if (cleanName.includes(clean) && clean.length > 3) {
        return original;
      }
    }
  }
  
  return null;
};

// Transform row data using dynamic column mapping
const transformInventoryRow = (row: any, mapping: Record<string, string>): InventoryItem => {
  const transformed: InventoryItem = {
    stockcode: String(row[mapping.stockcode] || ''),
    description: String(row[mapping.description] || ''),
    quantity_available: Number(row[mapping.quantity_available] || 0),
    quantity_ringfenced: Number(row[mapping.quantity_ringfenced] || 0),
    quantity_on_order: Number(row[mapping.quantity_on_order] || 0),
    packs_sold_avg_last_six_months: mapping.packs_sold_avg_last_six_months ? Number(row[mapping.packs_sold_avg_last_six_months] || 0) : 0,
    avg_cost: Number(row[mapping.avg_cost] || 0),
    group: Number(row[mapping.group] || 0)
  };
  
  // Add optional fields
  if (mapping.next_cost && row[mapping.next_cost] !== undefined) {
    transformed.next_cost = Number(row[mapping.next_cost] || 0);
  }
  if (mapping.calculated_next_avg_cost && row[mapping.calculated_next_avg_cost] !== undefined) {
    transformed.calculated_next_avg_cost = Number(row[mapping.calculated_next_avg_cost] || 0);
  }
  if (mapping.min_cost && row[mapping.min_cost] !== undefined) {
    transformed.min_cost = Number(row[mapping.min_cost] || 0);
  }
  if (mapping.last_po_cost && row[mapping.last_po_cost] !== undefined) {
    transformed.last_po_cost = Number(row[mapping.last_po_cost] || 0);
  }
  
  // Add competitor pricing
  if (mapping.Nupharm && row[mapping.Nupharm] !== undefined) {
    transformed.Nupharm = Number(row[mapping.Nupharm] || 0);
  }
  if (mapping.AAH2 && row[mapping.AAH2] !== undefined) {
    transformed.AAH2 = Number(row[mapping.AAH2] || 0);
  }
  if (mapping.ETH_LIST && row[mapping.ETH_LIST] !== undefined) {
    transformed.ETH_LIST = Number(row[mapping.ETH_LIST] || 0);
  }
  if (mapping.ETH_NET && row[mapping.ETH_NET] !== undefined) {
    transformed.ETH_NET = Number(row[mapping.ETH_NET] || 0);
  }
  if (mapping.LEXON2 && row[mapping.LEXON2] !== undefined) {
    transformed.LEXON2 = Number(row[mapping.LEXON2] || 0);
  }
  if (mapping.MCLEAN && row[mapping.MCLEAN] !== undefined) {
    transformed.MCLEAN = Number(row[mapping.MCLEAN] || 0);
  }
  if (mapping.APPLE && row[mapping.APPLE] !== undefined) {
    transformed.APPLE = Number(row[mapping.APPLE] || 0);
  }
  if (mapping.DAVIDSON && row[mapping.DAVIDSON] !== undefined) {
    transformed.DAVIDSON = Number(row[mapping.DAVIDSON] || 0);
  }
  if (mapping.AVER && row[mapping.AVER] !== undefined) {
    transformed.AVER = Number(row[mapping.AVER] || 0);
  }
  if (mapping.reva && row[mapping.reva] !== undefined) {
    transformed.reva = Number(row[mapping.reva] || 0);
  }
  if (mapping.eth_OOS && row[mapping.eth_OOS] !== undefined) {
    transformed.eth_OOS = String(row[mapping.eth_OOS] || '').toUpperCase();
  }
  if (mapping.SDT && row[mapping.SDT] !== undefined) {
    transformed.SDT = Number(row[mapping.SDT] || 0);
  }
  if (mapping.EDT && row[mapping.EDT] !== undefined) {
    transformed.EDT = Number(row[mapping.EDT] || 0);
  }
  if (mapping.packs_sold_last_30_days && row[mapping.packs_sold_last_30_days] !== undefined) {
    transformed.packs_sold_last_30_days = Number(row[mapping.packs_sold_last_30_days] || 0);
  }
  if (mapping.packs_sold_reva_last_30_days && row[mapping.packs_sold_reva_last_30_days] !== undefined) {
    transformed.packs_sold_reva_last_30_days = Number(row[mapping.packs_sold_reva_last_30_days] || 0);
  }
  
  // Add yesterday's pricing data for trend analysis
  if (mapping.AAH_yesterday && row[mapping.AAH_yesterday] !== undefined) {
    const rawValue = row[mapping.AAH_yesterday];
    // Handle various data types that might come from Excel
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      const numValue = Number(rawValue);
      if (!isNaN(numValue) && numValue > 0) {
        transformed.AAH_yesterday = numValue;
      }
    }
  }
  
  if (mapping.Nupharm_yesterday && row[mapping.Nupharm_yesterday] !== undefined) {
    const rawValue = row[mapping.Nupharm_yesterday];
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      const numValue = Number(rawValue);
      if (!isNaN(numValue) && numValue > 0) {
        transformed.Nupharm_yesterday = numValue;
      }
    }
  }
  
  if (mapping.ETH_NET_yesterday && row[mapping.ETH_NET_yesterday] !== undefined) {
    const rawValue = row[mapping.ETH_NET_yesterday];
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      const numValue = Number(rawValue);
      if (!isNaN(numValue) && numValue > 0) {
        transformed.ETH_NET_yesterday = numValue;
      }
    }
  }
  
  if (mapping.LEXON2_yesterday && row[mapping.LEXON2_yesterday] !== undefined) {
    const rawValue = row[mapping.LEXON2_yesterday];
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      const numValue = Number(rawValue);
      if (!isNaN(numValue) && numValue > 0) {
        transformed.LEXON2_yesterday = numValue;
      }
    }
  }
  
  // Add Min Supplier field
  if (mapping.min_supplier && row[mapping.min_supplier] !== undefined) {
    const rawValue = row[mapping.min_supplier];
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      transformed.min_supplier = String(rawValue).trim();
    }
  }
  
  // Add Bin Location field
  if (mapping.binLocation && row[mapping.binLocation] !== undefined) {
    const rawValue = row[mapping.binLocation];
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      transformed.binLocation = String(rawValue).trim();
    }
  }
  
  return transformed;
};

// Calculate velocity categories based on monthly usage ranking
export const calculateVelocityCategories = (items: InventoryItem[]): Map<string, {rank: number, category: number}> => {
  const itemsWithSales = items.filter(item => item.packs_sold_avg_last_six_months > 0);
  const sorted = itemsWithSales.sort((a, b) => b.packs_sold_avg_last_six_months - a.packs_sold_avg_last_six_months);
  
  const velocityLookup = new Map<string, {rank: number, category: number}>();
  
  sorted.forEach((item, index) => {
    const rank = index + 1;
    let category: number;
    
    if (rank <= 200) category = 1;
    else if (rank <= 400) category = 2;
    else if (rank <= 600) category = 3;
    else if (rank <= 800) category = 4;
    else if (rank <= 1000) category = 5;
    else category = 6;
    
    velocityLookup.set(item.stockcode, { rank, category });
  });
  
  return velocityLookup;
};

// Calculate Next Buying Price using hierarchy
export const calculateNBP = (item: InventoryItem): {nbp: number | null, source: 'next_cost' | 'min_cost' | 'last_po_cost' | 'none'} => {
  if (item.next_cost && item.next_cost > 0) {
    return { nbp: Number(item.next_cost.toFixed(2)), source: 'next_cost' };
  }
  if (item.min_cost && item.min_cost > 0) {
    return { nbp: Number(item.min_cost.toFixed(2)), source: 'min_cost' };
  }
  if (item.last_po_cost && item.last_po_cost > 0) {
    return { nbp: Number(item.last_po_cost.toFixed(2)), source: 'last_po_cost' };
  }
  return { nbp: null, source: 'none' };
};

// Calculate price trend direction and percentage
export const calculateTrend = (nbp: number | null, avgCost: number, threshold: number = 5): {direction: string, percentage: string} => {
  if (!nbp || !avgCost || avgCost === 0) {
    return { direction: 'N/A', percentage: 'N/A' };
  }
  
  const percentageChange = ((nbp - avgCost) / avgCost) * 100;
  
  let direction: string;
  if (Math.abs(percentageChange) <= threshold) {
    direction = 'STABLE';
  } else if (percentageChange > threshold) {
    direction = 'UP';
  } else {
    direction = 'DOWN';
  }
  
  const percentageStr = percentageChange >= 0 ? `+${percentageChange.toFixed(1)}%` : `${percentageChange.toFixed(1)}%`;
  
  return { direction, percentage: percentageStr };
};

// Extract competitive pricing data (excluding ETH)
export const getCompetitivePricing = (item: InventoryItem): {
  lowestMarketPrice: number | null;
  marginVsLowest: number | null;
  pricingStrategy: string;
  competitorCount: number;
} => {
  const competitors = ['Nupharm', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2'];
  const prices: number[] = [];
  
  competitors.forEach(competitor => {
    const price = item[competitor as keyof InventoryItem] as number;
    if (price && price > 0) {
      prices.push(Number(price.toFixed(2)));
    }
  });
  
  if (prices.length === 0) {
    return {
      lowestMarketPrice: null,
      marginVsLowest: null,
      pricingStrategy: 'Unknown',
      competitorCount: 0
    };
  }
  
  const lowestMarketPrice = Math.min(...prices);
  const marginVsLowest = calculateMarginVsLowest(lowestMarketPrice, item.avg_cost);
  const pricingStrategy = calculatePricingStrategy(lowestMarketPrice, item.avg_cost);
  
  return {
    lowestMarketPrice,
    marginVsLowest,
    pricingStrategy,
    competitorCount: prices.length
  };
};

// Calculate margin percentage vs lowest market price
const calculateMarginVsLowest = (lowestMarketPrice: number, avgCost: number): number | null => {
  if (!lowestMarketPrice || !avgCost || avgCost === 0) {
    return null;
  }
  
  const margin = ((lowestMarketPrice - avgCost) / avgCost) * 100;
  return Number(margin.toFixed(1));
};

// Determine pricing strategy based on market comparison
const calculatePricingStrategy = (lowestMarketPrice: number, avgCost: number): string => {
  if (!lowestMarketPrice || !avgCost || avgCost === 0) {
    return 'Unknown';
  }
  
  if (lowestMarketPrice > avgCost * 1.1) {
    return 'Profitable';
  } else if (lowestMarketPrice > avgCost) {
    return 'Marginal';
  } else {
    return 'Loss Required';
  }
};

// Calculate AAH price trend analysis
export const calculateAAHTrend = (item: InventoryItem): {
  current: number | null;
  yesterday: number | null;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
  percentageChange: number | null;
  changeAmount: number | null;
} => {
  return calculateCompetitorTrend(item.AAH2, item.AAH_yesterday, 'AAH', item.stockcode);
};

// Calculate Nupharm price trend analysis
export const calculateNupharmTrend = (item: InventoryItem): {
  current: number | null;
  yesterday: number | null;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
  percentageChange: number | null;
  changeAmount: number | null;
} => {
  return calculateCompetitorTrend(item.Nupharm, item.Nupharm_yesterday, 'Nupharm', item.stockcode);
};

// Calculate ETH NET price trend analysis
export const calculateETHNetTrend = (item: InventoryItem): {
  current: number | null;
  yesterday: number | null;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
  percentageChange: number | null;
  changeAmount: number | null;
} => {
  return calculateCompetitorTrend(item.ETH_NET, item.ETH_NET_yesterday, 'ETH_NET', item.stockcode);
};

// Calculate LEXON price trend analysis
export const calculateLexonTrend = (item: InventoryItem): {
  current: number | null;
  yesterday: number | null;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
  percentageChange: number | null;
  changeAmount: number | null;
} => {
  return calculateCompetitorTrend(item.LEXON2, item.LEXON2_yesterday, 'LEXON', item.stockcode);
};

// Generic competitor price trend calculator
const calculateCompetitorTrend = (
  current: number | null,
  yesterday: number | null,
  competitorName?: string,
  stockcode?: string
): {
  current: number | null;
  yesterday: number | null;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW' | 'UNKNOWN';
  percentageChange: number | null;
  changeAmount: number | null;
} => {
  // Validate and parse current price
  const validCurrent = current && typeof current === 'number' && current > 0 ? Number(current) : null;
  
  // Validate and parse yesterday price
  const validYesterday = yesterday && typeof yesterday === 'number' && yesterday > 0 ? Number(yesterday) : null;
  
  // If no current price, unknown status
  if (!validCurrent) {
    return {
      current: null,
      yesterday: validYesterday,
      trend: 'UNKNOWN',
      percentageChange: null,
      changeAmount: null,
    };
  }
  
  // If current price but no yesterday price, it's new
  if (!validYesterday) {
    return {
      current: validCurrent,
      yesterday: null,
      trend: 'NEW',
      percentageChange: null,
      changeAmount: null,
    };
  }
  
  // Calculate change with higher precision
  const changeAmount = validCurrent - validYesterday;
  const percentageChange = (changeAmount / validYesterday) * 100;
  
  // Debug logging for troubleshooting (random sample)
  if (stockcode && competitorName && Math.random() < 0.01) {
    console.log(`${competitorName} Trend Debug for ${stockcode}:`, {
      current: validCurrent,
      yesterday: validYesterday, 
      changeAmount: changeAmount,
      percentageChange: percentageChange
    });
  }
  
  // Round to 2 decimal places for calculation
  const roundedPercentageChange = Math.round(percentageChange * 100) / 100;
  const roundedChangeAmount = Math.round(changeAmount * 100) / 100;
  
  // Determine trend (using 0.05% threshold for stability)
  let trend: 'UP' | 'DOWN' | 'STABLE';
  if (Math.abs(roundedPercentageChange) < 0.05) {
    trend = 'STABLE';
  } else if (changeAmount > 0) {
    trend = 'UP';
  } else {
    trend = 'DOWN';
  }
  
  return {
    current: validCurrent,
    yesterday: validYesterday,
    trend,
    percentageChange: roundedPercentageChange,
    changeAmount: roundedChangeAmount,
  };
};

// Analyze individual inventory item
export const analyzeInventoryItem = (
  item: InventoryItem, 
  velocityLookup: Map<string, {rank: number, category: number}>
): ProcessedInventoryItem => {
  // Basic stock calculations
  const currentStock = item.quantity_available + item.quantity_ringfenced;
  const totalStock = currentStock + item.quantity_on_order;
  
  // Stock valuations (calculate early for overstock detection)
  const stockValue = Number((currentStock * item.avg_cost).toFixed(2));
  
  // Calculate months of stock
  let monthsOfStock = 0;
  if (item.packs_sold_avg_last_six_months > 0) {
    monthsOfStock = Number((totalStock / item.packs_sold_avg_last_six_months).toFixed(1));
  } else if (totalStock > 0) {
    monthsOfStock = 999.9; // Cap for Excel compatibility
  }
  
  // Determine if overstocked
  const isOverstocked = item.packs_sold_avg_last_six_months > 0 && monthsOfStock > 6;
  const onOrderValue = Number((item.quantity_on_order * item.avg_cost).toFixed(2));
  const totalPotentialValue = Number((totalStock * item.avg_cost).toFixed(2));
  
  // Velocity information
  const velocityInfo = velocityLookup.get(item.stockcode);
  const velocityRank = velocityInfo?.rank || null;
  const velocityCategory = (velocityInfo?.category as 1 | 2 | 3 | 4 | 5 | 6) || 'N/A' as const;
  
  // Watchlist status
  // Build watchlist indicators
  let watchlist = '';
  if (item.group === 1) {
    watchlist += '⚠️';
  }
  if (item.eth_OOS === 'Y') {
    watchlist += '❗';
  }
  const finalWatchlist = watchlist || '-' as const;
  
  // NBP and trend analysis
  const { nbp, source: nbpSource } = calculateNBP(item);
  const { direction: trendDirection, percentage: trendPercentage } = calculateTrend(nbp, item.avg_cost);
  
  // Competitive pricing analysis
  const {
    lowestMarketPrice,
    marginVsLowest,
    pricingStrategy,
    competitorCount
  } = getCompetitivePricing(item);
  
  // Competitor price trend analysis
  const aahTrend = calculateAAHTrend(item);
  const nupharmTrend = calculateNupharmTrend(item);
  const ethNetTrend = calculateETHNetTrend(item);
  const lexonTrend = calculateLexonTrend(item);
  
  return {
    ...item,
    id: `inv_${item.stockcode}_${Date.now()}`, // Unique identifier
    velocityRank,
    velocityCategory,
    currentStock,
    stock: currentStock, // Alias for UI compatibility
    totalStock,
    averageUsage: item.packs_sold_avg_last_six_months || null, // Monthly usage data
    monthsOfStock,
    isOverstocked,
    stockValue,
    onOrderValue,
    totalPotentialValue,
    nbp,
    nbpSource,
    nextBuyingPrice: nbp, // Alias for UI compatibility
    trendDirection: trendDirection as 'UP' | 'DOWN' | 'STABLE' | 'N/A',
    trendPercentage,
    lowestMarketPrice,
    bestCompetitorPrice: lowestMarketPrice, // Alias for UI compatibility
    marginVsLowest,
    pricingStrategy: pricingStrategy as 'Profitable' | 'Marginal' | 'Loss Required' | 'Unknown',
    competitorCount,
    aahTrend,
    nupharmTrend,
    ethNetTrend,
    lexonTrend,
    watchlist: finalWatchlist
  };
};

// Main processing function
export const processInventoryExcelFile = async (file: File): Promise<ProcessedInventoryData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }

        // Look for 'maintenance' sheet first, then fallback to first sheet
        const maintenanceSheetName = sheetNames.find(name => name.toLowerCase().includes('maintenance')) || sheetNames[0];
        
        // Also look for 'stock_data' sheet for bin location information
        const stockDataSheetName = sheetNames.find(name => name.toLowerCase().includes('stock_data') || name.toLowerCase().includes('stock data'));
        
        console.log('📊 Processing Excel sheets:', { 
          allSheets: sheetNames, 
          maintenanceSheet: maintenanceSheetName, 
          stockDataSheet: stockDataSheetName 
        });
        
        // Process maintenance sheet (main data)
        const maintenanceSheet = workbook.Sheets[maintenanceSheetName];
        
        // Method 1: Default JSON conversion (force wide range to ensure we get all columns)
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[maintenanceSheetName], { 
          range: undefined, // Read entire sheet
          defval: null // Use null for empty cells
        });
        if (rawData.length > 0) {
          const headers1 = Object.keys(rawData[0] as object);
        }
        
        // Method 2: Raw values with header option
        const rawData2 = XLSX.utils.sheet_to_json(workbook.Sheets[maintenanceSheetName], { header: 1 });
        if (rawData2.length > 0) {
        }
        
        // Method 3: Range-based parsing to ensure we get all columns
        const range = XLSX.utils.decode_range(maintenanceSheet['!ref'] || 'A1:Z1000');
        const rawData3 = XLSX.utils.sheet_to_json(workbook.Sheets[maintenanceSheetName], { range: range });
        if (rawData3.length > 0) {
          const headers3 = Object.keys(rawData3[0] as object);
        }
        
        // Debug: Check if packs_sold_avg_last_six_months exists in ANY sheet
        sheetNames.forEach(sName => {
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sName]);
          if (sheetData.length > 0) {
            const headers = Object.keys(sheetData[0] as object);
            const hasPacksColumn = headers.some(h => h.toLowerCase().includes('packs_sold_avg_last_six_months'));
            
            // Extra debugging for maintenance sheet
            if (sName.toLowerCase().includes('maintenance')) {
            }
          }
        });
        
        if (rawData.length === 0) {
          throw new Error('Excel sheet is empty. Please upload a file with data.');
        }
        
        // Get headers and clean them up
        const rawHeaders = Object.keys(rawData[0] as object);
        
        // Generate column mapping
        const columnMapping = generateInventoryColumnMapping(rawHeaders);
        
        // Generate column mapping
        
        // Check for minimum required columns
        const requiredFields = ['stockcode', 'description', 'quantity_available', 'packs_sold_avg_last_six_months', 'avg_cost'];
        const missingFields = requiredFields.filter(field => !columnMapping[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required columns: ${missingFields.join(', ')}. Please ensure your file includes these fields.`);
        }
        
        // Transform raw data from maintenance sheet
        const transformedData = rawData.map((row: any) => transformInventoryRow(row, columnMapping));
        
        // Process stock_data sheet if it exists
        let stockDataMap = new Map<string, any>();
        if (stockDataSheetName) {
          try {
            const stockRawData = XLSX.utils.sheet_to_json(workbook.Sheets[stockDataSheetName], { 
              range: undefined,
              defval: null
            });
            
            console.log('📦 Stock data sheet found:', {
              sheetName: stockDataSheetName,
              rowCount: stockRawData.length,
              sampleHeaders: stockRawData.length > 0 ? Object.keys(stockRawData[0] as object) : []
            });
            
            // Create a map of stock data keyed by description
            stockRawData.forEach((row: any) => {
              const description = String(row.description || '').trim();
              if (description) {
                stockDataMap.set(description, {
                  binLocation: String(row.binLocation || '').trim(),
                  nominalCode: String(row.nominalCode || '').trim(),
                  type: String(row.type || '').trim(),
                  quantityAvailable: Number(row.quantityAvailable || 0),
                  quantityRingfenced: Number(row.quantityRingfenced || 0),
                  overstockLocation1: String(row.overstockLocation1 || '').trim(),
                  overstockLocation2: String(row.overstockLocation2 || '').trim(),
                  overstockLocation3: String(row.overstockLocation3 || '').trim()
                });
              }
            });
            
            console.log('📦 Stock data processed:', {
              totalMappings: stockDataMap.size,
              sampleMapping: stockDataMap.size > 0 ? Array.from(stockDataMap.entries())[0] : null
            });
            
          } catch (error) {
            console.warn('⚠️ Error processing stock_data sheet:', error);
          }
        }
        
        // Merge stock data with maintenance data
        const mergedData = transformedData.map(item => {
          const stockData = stockDataMap.get(item.description);
          if (stockData) {
            return {
              ...item,
              binLocation: stockData.binLocation,
              // You can add other stock data fields here if needed
              overstockLocation1: stockData.overstockLocation1,
              overstockLocation2: stockData.overstockLocation2,
              overstockLocation3: stockData.overstockLocation3
            };
          }
          return item;
        });
        
        console.log('🔗 Data merge complete:', {
          maintenanceItems: transformedData.length,
          stockDataItems: stockDataMap.size,
          itemsWithBinLocation: mergedData.filter(item => item.binLocation).length
        });
        
        // Calculate velocity categories using merged data
        const velocityLookup = calculateVelocityCategories(mergedData);
        
        // Analyze all items using merged data
        const analyzedItems = mergedData.map(item => analyzeInventoryItem(item, velocityLookup));
        
        // Sort by stock value (descending)
        analyzedItems.sort((a, b) => b.stockValue - a.stockValue);
        
        // Generate summaries and breakdowns
        const summaryStats = generateInventorySummaryStats(analyzedItems);
        const velocityBreakdown = generateVelocityBreakdown(analyzedItems);
        const trendBreakdown = generateTrendBreakdown(analyzedItems);
        const strategyBreakdown = generateStrategyBreakdown(analyzedItems);
        const priorityIssues = identifyPriorityIssues(analyzedItems);
        const overstockItems = analyzedItems.filter(item => item.isOverstocked);
        
        const result: ProcessedInventoryData = {
          fileName: file.name,
          totalProducts: analyzedItems.length,
          analyzedItems,
          summaryStats,
          priorityIssues,
          overstockItems,
          velocityBreakdown,
          trendBreakdown,
          strategyBreakdown,
          rawData: mergedData
        };
        
        resolve(result);
      } catch (error) {
        reject(new Error(error instanceof Error ? error.message : 'Invalid Excel file format. Please ensure your file follows the required structure.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file. Please try again.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Generate summary statistics
export const generateInventorySummaryStats = (items: ProcessedInventoryItem[]): InventorySummaryStats => {
  const totalProducts = items.length;
  const totalStockValue = items.reduce((sum, item) => sum + item.stockValue, 0);
  const totalOnOrderValue = items.reduce((sum, item) => sum + item.onOrderValue, 0);
  const totalPotentialValue = items.reduce((sum, item) => sum + item.totalPotentialValue, 0);
  
  // Overstock calculations
  const overstockItems = items.filter(item => item.isOverstocked);
  const totalOverstockStockValue = overstockItems.reduce((sum, item) => sum + item.stockValue, 0);
  const totalOverstockOnOrderValue = overstockItems.reduce((sum, item) => sum + item.onOrderValue, 0);
  const totalOverstockPotentialValue = overstockItems.reduce((sum, item) => sum + item.totalPotentialValue, 0);
  const totalOverstockItems = overstockItems.length;
  const overstockPercentage = totalProducts > 0 ? (totalOverstockItems / totalProducts) * 100 : 0;
  
  // Watchlist calculations
  const watchlistItems = items.filter(item => item.watchlist === '⚠️');
  const watchlistValue = watchlistItems.reduce((sum, item) => sum + item.stockValue, 0);
  const watchlistCount = watchlistItems.length;
  
  // Overstock watchlist calculations
  const overstockWatchlistItems = overstockItems.filter(item => item.watchlist === '⚠️');
  const overstockWatchlistCount = overstockWatchlistItems.length;
  const overstockWatchlistValue = overstockWatchlistItems.reduce((sum, item) => sum + item.stockValue, 0);
  
  // New strategic metrics
  // OOS: Items with 0 qty available, 0 ringfenced, 0 on order
  const outOfStockItems = items.filter(item => 
    item.quantity_available === 0 && 
    item.quantity_ringfenced === 0 && 
    item.quantity_on_order === 0
  );
  const outOfStockFastMovers = outOfStockItems.filter(item => 
    typeof item.velocityCategory === 'number' && item.velocityCategory <= 3
  );
  
  // Margin Opportunities: avg_cost < (lowest_competitor_price * 0.9) - 10% margin room
  const marginOpportunityItems = items.filter(item => 
    item.lowestMarketPrice && 
    item.avg_cost < (item.lowestMarketPrice * 0.9)
  );
  const marginOpportunityValue = marginOpportunityItems.reduce((sum, item) => {
    if (item.lowestMarketPrice) {
      const potentialRevenue = (item.lowestMarketPrice - item.avg_cost) * item.currentStock;
      return sum + potentialRevenue;
    }
    return sum;
  }, 0);
  
  // Cost Disadvantage: avg_cost > lowestMarketPrice - where our cost is above market low
  const costDisadvantageItems = items.filter(item => {
    return item.lowestMarketPrice && item.avg_cost > item.lowestMarketPrice;
  });
  const costDisadvantageValue = costDisadvantageItems.reduce((sum, item) => sum + item.stockValue, 0);
  
  // Stock Risk: <2 weeks supply (current stock / monthly usage < 0.5)
  const stockRiskItems = items.filter(item => 
    item.packs_sold_avg_last_six_months > 0 && 
    (item.currentStock / item.packs_sold_avg_last_six_months) < 0.5
  );
  const stockRiskValue = stockRiskItems.reduce((sum, item) => sum + item.stockValue, 0);
  
  return {
    totalProducts,
    totalStockValue: Number(totalStockValue.toFixed(2)),
    totalOnOrderValue: Number(totalOnOrderValue.toFixed(2)),
    totalPotentialValue: Number(totalPotentialValue.toFixed(2)),
    totalOverstockStockValue: Number(totalOverstockStockValue.toFixed(2)),
    totalOverstockOnOrderValue: Number(totalOverstockOnOrderValue.toFixed(2)),
    totalOverstockPotentialValue: Number(totalOverstockPotentialValue.toFixed(2)),
    totalOverstockItems,
    overstockPercentage: Number(overstockPercentage.toFixed(1)),
    watchlistValue: Number(watchlistValue.toFixed(2)),
    watchlistCount,
    overstockWatchlistCount,
    overstockWatchlistValue: Number(overstockWatchlistValue.toFixed(2)),
    outOfStockItems: outOfStockItems.length,
    outOfStockFastMovers: outOfStockFastMovers.length,
    marginOpportunityItems: marginOpportunityItems.length,
    marginOpportunityValue: Number(marginOpportunityValue.toFixed(2)),
    costDisadvantageItems: costDisadvantageItems.length,
    costDisadvantageValue: Number(costDisadvantageValue.toFixed(2)),
    stockRiskItems: stockRiskItems.length,
    stockRiskValue: Number(stockRiskValue.toFixed(2))
  };
};

// Generate velocity breakdown
export const generateVelocityBreakdown = (items: ProcessedInventoryItem[]): VelocityBreakdown[] => {
  const breakdown: VelocityBreakdown[] = [];
  
  for (let category = 1; category <= 6; category++) {
    const categoryItems = items.filter(item => item.velocityCategory === category);
    const stockValue = categoryItems.reduce((sum, item) => sum + item.stockValue, 0);
    
    breakdown.push({
      category,
      itemCount: categoryItems.length,
      stockValue: Number(stockValue.toFixed(2))
    });
  }
  
  return breakdown;
};

// Generate trend breakdown
export const generateTrendBreakdown = (items: ProcessedInventoryItem[]): TrendBreakdown[] => {
  const trendMap = new Map<string, {itemCount: number, stockValue: number}>();
  
  items.forEach(item => {
    if (item.trendDirection !== 'N/A') {
      const existing = trendMap.get(item.trendDirection) || {itemCount: 0, stockValue: 0};
      trendMap.set(item.trendDirection, {
        itemCount: existing.itemCount + 1,
        stockValue: existing.stockValue + item.stockValue
      });
    }
  });
  
  return Array.from(trendMap.entries()).map(([direction, data]) => ({
    direction,
    itemCount: data.itemCount,
    stockValue: Number(data.stockValue.toFixed(2))
  }));
};

// Generate strategy breakdown
export const generateStrategyBreakdown = (items: ProcessedInventoryItem[]): StrategyBreakdown[] => {
  const strategyMap = new Map<string, {itemCount: number, stockValue: number}>();
  
  items.forEach(item => {
    const existing = strategyMap.get(item.pricingStrategy) || {itemCount: 0, stockValue: 0};
    strategyMap.set(item.pricingStrategy, {
      itemCount: existing.itemCount + 1,
      stockValue: existing.stockValue + item.stockValue
    });
  });
  
  return Array.from(strategyMap.entries()).map(([strategy, data]) => ({
    strategy,
    itemCount: data.itemCount,
    stockValue: Number(data.stockValue.toFixed(2))
  }));
};

// Identify priority issues
export const identifyPriorityIssues = (items: ProcessedInventoryItem[]): PriorityIssue[] => {
  const issues: PriorityIssue[] = [];
  
  items.forEach(item => {
    // High-value overstock in fast-moving categories
    if (item.isOverstocked && item.stockValue > 1000 && typeof item.velocityCategory === 'number' && item.velocityCategory <= 3) {
      issues.push({
        id: `issue_${item.id}_overstock`,
        type: 'HIGH_VALUE_OVERSTOCK_FAST_MOVER',
        item,
        severity: 'critical',
        description: `High-value overstock (£${item.stockValue.toLocaleString()}) in fast-moving category ${item.velocityCategory}`,
        recommendation: 'Consider immediate clearance or promotional activity',
        impactValue: item.stockValue
      });
    }
    
    // Watchlist items with concerning trends
    if (item.watchlist === '⚠️' && item.trendDirection === 'DOWN') {
      issues.push({
        id: `issue_${item.id}_watchlist_decline`,
        type: 'WATCHLIST_DECLINING_PRICE',
        item,
        severity: 'high',
        description: `Watchlist item with declining price trend (${item.trendPercentage})`,
        recommendation: 'Review pricing strategy and consider inventory reduction',
        impactValue: item.stockValue
      });
    }
    
    // Competitive disadvantage
    if (item.pricingStrategy === 'Loss Required' && item.competitorCount >= 3) {
      issues.push({
        id: `issue_${item.id}_competitive`,
        type: 'COMPETITIVE_DISADVANTAGE',
        item,
        severity: 'medium',
        description: `Required to sell at loss vs ${item.competitorCount} competitors`,
        recommendation: 'Evaluate supplier negotiations or product discontinuation',
        impactValue: item.stockValue
      });
    }
    
    // Excessive months of stock
    if (item.monthsOfStock > 12 && item.stockValue > 500) {
      issues.push({
        id: `issue_${item.id}_excessive_stock`,
        type: 'EXCESSIVE_MONTHS_STOCK',
        item,
        severity: 'medium',
        description: `Excessive stock (${item.monthsOfStock} months) worth £${item.stockValue.toLocaleString()}`,
        recommendation: 'Consider stock reduction or promotional pricing',
        impactValue: item.stockValue
      });
    }
  });
  
  // Sort by impact value (descending)
  return issues.sort((a, b) => b.impactValue - a.impactValue);
};

// Export functions for Excel generation
export const exportInventoryAnalysisToExcel = (data: ProcessedInventoryData): void => {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: All Products
  const allProductsData = data.analyzedItems.map((item, index) => ({
    'Rank': index + 1,
    'Stock Code': item.stockcode,
    'Description': item.description,
    'Qty Available': item.quantity_available,
    'Qty Ringfenced': item.quantity_ringfenced,
    'Qty On Order': item.quantity_on_order,
    'Current Stock': item.currentStock,
    'Total Stock': item.totalStock,
    'Monthly Usage': item.packs_sold_avg_last_six_months,
    'Months of Stock': item.monthsOfStock,
    'Is Overstocked': item.isOverstocked ? 'Yes' : 'No',
    'Velocity Rank': item.velocityRank || 'N/A',
    'Velocity Category': item.velocityCategory,
    'Watchlist': item.watchlist,
    'Stock Value': item.stockValue,
    'On Order Value': item.onOrderValue,
    'Total Potential Value': item.totalPotentialValue,
    'Avg Cost': item.avg_cost,
    'Calculated Next Avg Cost': (item as any).calculated_next_avg_cost || 'N/A',
    'NBP': item.nbp || 'N/A',
    'NBP Source': item.nbpSource,
    'Trend Direction': item.trendDirection,
    'Trend Percentage': item.trendPercentage,
    'Lowest Market Price': item.lowestMarketPrice || 'N/A',
    'Margin vs Lowest': item.marginVsLowest || 'N/A',
    'Pricing Strategy': item.pricingStrategy,
    'Competitor Count': item.competitorCount,
    'Our Price (AVER)': item.AVER || 'N/A'
  }));
  
  const allProductsSheet = XLSX.utils.json_to_sheet(allProductsData);
  XLSX.utils.book_append_sheet(workbook, allProductsSheet, 'All Products');
  
  // Sheet 2: Overstock Only
  if (data.overstockItems.length > 0) {
    const overstockData = data.overstockItems.map((item, index) => ({
      'Overstock Rank': index + 1,
      'Stock Code': item.stockcode,
      'Description': item.description,
      'Months of Stock': item.monthsOfStock,
      'Stock Value': item.stockValue,
      'Velocity Category': item.velocityCategory,
      'Watchlist': item.watchlist,
      'Trend Direction': item.trendDirection,
      'Pricing Strategy': item.pricingStrategy
    }));
    
    const overstockSheet = XLSX.utils.json_to_sheet(overstockData);
    XLSX.utils.book_append_sheet(workbook, overstockSheet, 'Overstock Only');
  }
  
  // Sheet 3: Summary
  const summaryData = [
    ['OVERALL INVENTORY SUMMARY', ''],
    ['Total Products Analyzed', data.summaryStats.totalProducts.toLocaleString()],
    ['Stock Value (In Building)', `£${data.summaryStats.totalStockValue.toLocaleString()}`],
    ['On Order Value', `£${data.summaryStats.totalOnOrderValue.toLocaleString()}`],
    ['Total Potential Value', `£${data.summaryStats.totalPotentialValue.toLocaleString()}`],
    ['', ''],
    ['OVERSTOCK SUMMARY', ''],
    ['Total Overstock Items', `${data.summaryStats.totalOverstockItems.toLocaleString()} (${data.summaryStats.overstockPercentage}%)`],
    ['Overstock Value (In Building)', `£${data.summaryStats.totalOverstockStockValue.toLocaleString()}`],
    ['Overstock On Order Value', `£${data.summaryStats.totalOverstockOnOrderValue.toLocaleString()}`],
    ['Overstock Total Potential Value', `£${data.summaryStats.totalOverstockPotentialValue.toLocaleString()}`],
    ['Overstock Watchlist Items', data.summaryStats.overstockWatchlistCount.toLocaleString()],
    ['Overstock Watchlist Value', `£${data.summaryStats.overstockWatchlistValue.toLocaleString()}`]
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Sheet 4: Priority Issues
  if (data.priorityIssues.length > 0) {
    const issuesData = data.priorityIssues.map((issue, index) => ({
      'Priority': index + 1,
      'Stock Code': issue.item.stockcode,
      'Description': issue.item.description,
      'Issue Type': issue.type,
      'Severity': issue.severity,
      'Issue Description': issue.description,
      'Recommendation': issue.recommendation,
      'Impact Value': issue.impactValue
    }));
    
    const issuesSheet = XLSX.utils.json_to_sheet(issuesData);
    XLSX.utils.book_append_sheet(workbook, issuesSheet, 'Priority Issues');
  }
  
  // Download file
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `inventory_analysis_${timestamp}.xlsx`);
}; 