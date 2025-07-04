const fs = require('fs');

// Read the file
const filePath = './src/pages/engine-room/InventoryAnalytics.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Update all remaining "Trend" headers to "Buying Trend" and adjust width
let fixedContent = content.replace(
  /headerName: 'Trend',\s*field: 'trendDirection',\s*width: 90,/g,
  "headerName: 'Buying Trend',\n      field: 'trendDirection',\n      width: 110,"
);

// Write back to file
fs.writeFileSync(filePath, fixedContent);

console.log('Updated all remaining Trend headers to Buying Trend'); 