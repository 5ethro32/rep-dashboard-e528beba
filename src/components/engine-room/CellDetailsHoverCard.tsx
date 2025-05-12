
import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Card } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercentage, isTrendDown } from '@/utils/trend-utils';

interface CellDetailsHoverCardProps {
  children: React.ReactNode;
  item: any;
  field: string;
  isColumnHeader?: boolean;
}

const CellDetailsHoverCard: React.FC<CellDetailsHoverCardProps> = ({
  children,
  item,
  field,
  isColumnHeader = false,
}) => {
  // If this is a column header or we don't have an item, just render children without hover
  if (isColumnHeader || !item || !item.id) {
    return <>{children}</>;
  }

  // Get the field display name for the header
  const getFieldDisplayName = () => {
    switch (field) {
      case 'avgCost': return 'Average Cost';
      case 'nextBuyingPrice': return 'Next Buying Price';
      case 'currentREVAPrice': return 'Current Price';
      case 'proposedPrice': return 'Proposed Price';
      case 'currentREVAMargin': return 'Current Margin';
      case 'proposedMargin': return 'Proposed Margin';
      case 'marketLow': return 'Market Low';
      case 'trueMarketLow': return 'True Market Low';
      default: return field.charAt(0).toUpperCase() + field.slice(1);
    }
  };

  // Generate content based on field type
  const renderContent = () => {
    if (field === 'avgCost') {
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Average Cost:</span>
            <p className="font-medium">{formatCurrency(item.avgCost)}</p>
          </div>
          {item.nextBuyingPrice !== undefined && (
            <div>
              <span className="text-sm text-muted-foreground">Next Buying Price:</span>
              <div className="flex items-center gap-1">
                <p className="font-medium">{formatCurrency(item.nextBuyingPrice)}</p>
                {isTrendDown(item.nextBuyingPrice, item.avgCost) ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          )}
        </div>
      );
    } else if (field === 'nextBuyingPrice') {
      const trendDown = isTrendDown(item.nextBuyingPrice, item.avgCost);
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Next Buying Price:</span>
            <p className="font-medium">{formatCurrency(item.nextBuyingPrice)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Current Average Cost:</span>
            <p className="font-medium">{formatCurrency(item.avgCost)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trend:</span>
            <span className={`text-sm ${trendDown ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
              {trendDown ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {trendDown ? 'Down' : 'Up'}
            </span>
          </div>
        </div>
      );
    } else if (field === 'marketLow' || field === 'trueMarketLow') {
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">{getFieldDisplayName()}:</span>
            <p className="font-medium">{formatCurrency(item[field])}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Current Price:</span>
            <p className="font-medium">{formatCurrency(item.currentREVAPrice)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">% to Market:</span>
            <p className="font-medium">
              {((item.currentREVAPrice - item[field]) / item[field] * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      );
    } else if (field === 'currentREVAPrice' || field === 'proposedPrice') {
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">{getFieldDisplayName()}:</span>
            <p className="font-medium">{formatCurrency(item[field])}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Market Low:</span>
            <p className="font-medium">{formatCurrency(item.marketLow)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">% to Market Low:</span>
            <p className="font-medium">
              {((item[field] - item.marketLow) / item.marketLow * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      );
    } else if (field === 'currentREVAMargin' || field === 'proposedMargin') {
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">{getFieldDisplayName()}:</span>
            <p className="font-medium">{formatPercentage(item[field])}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Average Cost:</span>
            <p className="font-medium">{formatCurrency(item.avgCost)}</p>
          </div>
          {field === 'proposedMargin' && (
            <div>
              <span className="text-sm text-muted-foreground">Change from Current:</span>
              <p className={`font-medium ${item.proposedMargin > item.currentREVAMargin ? 'text-green-500' : 'text-red-500'}`}>
                {((item.proposedMargin - item.currentREVAMargin) * 100).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      );
    } else {
      // Default display for other fields
      return (
        <div>
          <span className="text-sm text-muted-foreground">{getFieldDisplayName()}:</span>
          <p className="font-medium">{item[field]}</p>
        </div>
      );
    }
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span tabIndex={0} className="cursor-default">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-3" side="top">
        <Card className="bg-gray-900/95 border-gray-800 shadow-lg rounded-md p-1">
          <div className="p-2">
            {renderContent()}
          </div>
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CellDetailsHoverCard;
