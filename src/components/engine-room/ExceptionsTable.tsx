
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExceptionsTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
}

const ExceptionsTable: React.FC<ExceptionsTableProps> = ({ data, onShowPriceDetails }) => {
  const rule1Flags = data.filter(item => item.flag1);
  const rule2Flags = data.filter(item => item.flag2);

  // Group the exceptions by rule and usage rank
  const groupBy = (items: any[], key: string) => {
    return items.reduce((result, item) => {
      const group = item[key];
      result[group] = result[group] || [];
      result[group].push(item);
      return result;
    }, {});
  };

  // Group Rule 1 exceptions by usage rank
  const rule1ByRank = groupBy(rule1Flags, 'usageRank');
  
  // Group Rule 2 exceptions by usage rank
  const rule2ByRank = groupBy(rule2Flags, 'usageRank');

  const renderExceptionTable = (items: any[]) => {
    return (
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Usage Rank</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Proposed Price</TableHead>
                <TableHead>Market Low</TableHead>
                <TableHead>True Market Low</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>On Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    No exceptions found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.usageRank}</TableCell>
                    <TableCell>£{item.currentREVAPrice.toFixed(2)}</TableCell>
                    <TableCell>£{(item.proposedPrice || 0).toFixed(2)}</TableCell>
                    <TableCell>£{(item.marketLow || 0).toFixed(2)}</TableCell>
                    <TableCell>£{(item.trueMarketLow || 0).toFixed(2)}</TableCell>
                    <TableCell>{item.appliedRule}</TableCell>
                    <TableCell>{item.inStock}</TableCell>
                    <TableCell>{item.onOrder}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onShowPriceDetails(item)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderRankGroups = (groupedData: Record<string, any[]>) => {
    return (
      <div className="space-y-6">
        {Object.keys(groupedData).sort().map((rank) => (
          <div key={rank} className="space-y-2">
            <h3 className="text-lg font-medium">Usage Rank {rank} ({groupedData[rank].length} items)</h3>
            {renderExceptionTable(groupedData[rank])}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Exceptions ({data.length})</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Exceptions
        </Button>
      </div>

      <Tabs defaultValue="rule1">
        <TabsList>
          <TabsTrigger value="rule1">Rule 1 Flags ({rule1Flags.length})</TabsTrigger>
          <TabsTrigger value="rule2">Rule 2 Flags ({rule2Flags.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="rule1" className="pt-4">
          {rule1Flags.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                These items are flagged because the proposed price is ≥ 10% above the True Market Low
              </p>
              {renderRankGroups(rule1ByRank)}
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No Rule 1 exceptions found
            </div>
          )}
        </TabsContent>
        <TabsContent value="rule2" className="pt-4">
          {rule2Flags.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                These items are flagged because the proposed margin is below 3%
              </p>
              {renderRankGroups(rule2ByRank)}
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No Rule 2 exceptions found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExceptionsTable;
