const fs = require('fs');

// Read the file
const filePath = './src/pages/engine-room/InventoryAnalytics.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Fix the remaining maxCompPrice references to minCompPrice
const fixedContent = content.replace(
  /item\.avg_cost > maxCompPrice && maxCompPrice > 0/g,
  'item.avg_cost > minCompPrice && minCompPrice > 0'
);

// Write back to file
fs.writeFileSync(filePath, fixedContent);

console.log('Fixed remaining maxCompPrice references'); 