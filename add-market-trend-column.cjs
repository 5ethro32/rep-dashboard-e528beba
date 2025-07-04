const fs = require('fs');

// Read the file
const filePath = './src/pages/engine-room/InventoryAnalytics.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Define the new Market Trend column
const marketTrendColumn = `    {
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
    },`;

// Pattern to find the Market column end and add the new column before Winning column
const pattern = /(cellStyle: { textAlign: 'right' as const, color: '#60a5fa', fontWeight: 'bold' },\s*sortable: true,\s*filter: 'agNumberColumnFilter',\s*resizable: true,\s*suppressSizeToFit: true\s*},)\s*(\s*{\s*headerName: 'Winning',)/g;

let fixedContent = content.replace(pattern, (match, p1, p2) => {
  return p1 + '\n' + marketTrendColumn + '\n' + p2;
});

// Write back to file
fs.writeFileSync(filePath, fixedContent);

console.log('Added Market Trend column to all AG Grid components'); 