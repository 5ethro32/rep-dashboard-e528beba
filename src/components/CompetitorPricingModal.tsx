import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface CompetitorPricingModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export const CompetitorPricingModal: React.FC<CompetitorPricingModalProps> = ({ item, isOpen, onClose }) => {
  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  // Calculate margin
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

  if (!item) return null;

  // Build comprehensive competitor data
  const competitorData = [];

  // Add all competitors with their current and yesterday prices
  if (item.AAH2 !== undefined) {
    competitorData.push({
      name: 'AAH',
      current: item.AAH2,
      yesterday: item.AAH_yesterday,
      trend: item.AAH_yesterday ? ((item.AAH2 - item.AAH_yesterday) / item.AAH_yesterday * 100).toFixed(1) : 'N/A',
      direction: item.AAH_yesterday ? (item.AAH2 > item.AAH_yesterday ? '↑' : item.AAH2 < item.AAH_yesterday ? '↓' : '−') : '🆕'
    });
  }

  if (item.Nupharm !== undefined) {
    competitorData.push({
      name: 'Nupharm',
      current: item.Nupharm,
      yesterday: item.Nupharm_yesterday,
      trend: item.Nupharm_yesterday ? ((item.Nupharm - item.Nupharm_yesterday) / item.Nupharm_yesterday * 100).toFixed(1) : 'N/A',
      direction: item.Nupharm_yesterday ? (item.Nupharm > item.Nupharm_yesterday ? '↑' : item.Nupharm < item.Nupharm_yesterday ? '↓' : '−') : '🆕'
    });
  }

  if (item.ETH_NET !== undefined) {
    competitorData.push({
      name: 'ETH NET',
      current: item.ETH_NET,
      yesterday: item.ETH_NET_yesterday,
      trend: item.ETH_NET_yesterday ? ((item.ETH_NET - item.ETH_NET_yesterday) / item.ETH_NET_yesterday * 100).toFixed(1) : 'N/A',
      direction: item.ETH_NET_yesterday ? (item.ETH_NET > item.ETH_NET_yesterday ? '↑' : item.ETH_NET < item.ETH_NET_yesterday ? '↓' : '−') : '🆕'
    });
  }

  if (item.ETH_LIST !== undefined) {
    competitorData.push({
      name: 'ETH LIST',
      current: item.ETH_LIST,
      yesterday: null, // No yesterday data available
      trend: 'N/A',
      direction: '−'
    });
  }

  if (item.LEXON2 !== undefined) {
    competitorData.push({
      name: 'LEXON',
      current: item.LEXON2,
      yesterday: item.LEXON_yesterday,
      trend: item.LEXON_yesterday ? ((item.LEXON2 - item.LEXON_yesterday) / item.LEXON_yesterday * 100).toFixed(1) : 'N/A',
      direction: item.LEXON_yesterday ? (item.LEXON2 > item.LEXON_yesterday ? '↑' : item.LEXON2 < item.LEXON_yesterday ? '↓' : '−') : '🆕'
    });
  }

  // Sort competitors by current price (lowest first)
  competitorData.sort((a, b) => (a.current || 0) - (b.current || 0));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">
            Detailed Market Analysis: {item.stockcode}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {/* Product Overview */}
          <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-md font-semibold text-white mb-3">Product Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Our Price:</span>
                <div className="text-white font-semibold">{formatCurrency(item.AVER || 0)}</div>
              </div>
              <div>
                <span className="text-gray-400">Our Margin:</span>
                <div className={`font-semibold ${getMarginColor(calculateMargin(item))}`}>
                  {formatMargin(calculateMargin(item))}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Stock Value:</span>
                <div className="text-white">{formatCurrency(item.stockValue || 0)}</div>
              </div>
              <div>
                <span className="text-gray-400">Velocity Group:</span>
                <div className={`font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                  {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Competitor Pricing Table */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-white mb-3">Competitor Pricing Analysis</h4>
            <div className="overflow-x-auto bg-gray-800/30 border border-gray-700 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="text-left text-gray-400 p-3">Competitor</th>
                    <th className="text-right text-gray-400 p-3">Current</th>
                    <th className="text-right text-gray-400 p-3">Yesterday</th>
                    <th className="text-center text-gray-400 p-3">Change</th>
                    <th className="text-right text-gray-400 p-3">vs Our Price</th>
                    <th className="text-center text-gray-400 p-3">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorData.map((competitor, index) => {
                    const ourPrice = item.AVER || 0;
                    const priceDiff = competitor.current ? competitor.current - ourPrice : 0;
                    const priceDiffPercent = ourPrice > 0 ? (priceDiff / ourPrice * 100).toFixed(1) : 'N/A';
                    const isWinning = competitor.current && ourPrice > 0 ? ourPrice <= competitor.current : false;
                    
                    return (
                      <tr key={competitor.name} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="p-3 text-white font-medium">{competitor.name}</td>
                        <td className="text-right text-white p-3">
                          {competitor.current ? formatCurrency(competitor.current) : 'N/A'}
                        </td>
                        <td className="text-right text-gray-400 p-3">
                          {competitor.yesterday ? formatCurrency(competitor.yesterday) : 'N/A'}
                        </td>
                        <td className="text-center p-3">
                          <span className={`flex items-center justify-center gap-1 ${
                            competitor.direction === '↑' ? 'text-red-400' : 
                            competitor.direction === '↓' ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {competitor.direction}
                            {competitor.trend !== 'N/A' && (
                              <span className="text-xs">
                                {competitor.trend}%
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="text-right p-3">
                          {competitor.current && ourPrice > 0 ? (
                            <span className={priceDiff >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {priceDiff >= 0 ? '+' : ''}{formatCurrency(priceDiff)} ({priceDiffPercent}%)
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="text-center p-3">
                          {competitor.current && ourPrice > 0 ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isWinning ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                            }`}>
                              {isWinning ? 'WINNING' : 'LOSING'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Additional Details */}
          <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
            <h4 className="text-md font-semibold text-white mb-3">Additional Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Stock Qty:</span>
                <div className="text-white">{(item.currentStock || 0).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">Months Stock:</span>
                <div className="text-white">
                  {item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Trend:</span>
                <div className={`font-medium ${getTrendColor(item.trend)}`}>
                  {item.trend || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">On Order:</span>
                <div className="text-white">{(item.quantity_on_order || 0).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">Average Cost:</span>
                <div className="text-white">{item.avg_cost ? formatCurrency(item.avg_cost) : 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-400">NBP:</span>
                <div className="text-white">{item.min_cost ? formatCurrency(item.min_cost) : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 