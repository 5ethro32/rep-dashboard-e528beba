const fs = require('fs');

// Read the file
const filePath = './src/pages/engine-room/InventoryAnalytics.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Fix the cost risk logic - change from Math.max to Math.min
let fixedContent = content.replace(
  /const maxCompPrice = competitorPrices\.length > 0 \? Math\.max\(\.\.\.competitorPrices\) : 0;/g,
  'const minCompPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;'
);

// Update the condition to use minCompPrice instead of maxCompPrice
fixedContent = fixedContent.replace(
  /return item\.avg_cost > maxCompPrice && item\.trendDirection === 'DOWN' && maxCompPrice > 0;/g,
  'return item.avg_cost > minCompPrice && item.trendDirection === \'DOWN\' && minCompPrice > 0;'
);

// Also update the tooltip description
fixedContent = fixedContent.replace(
  /Products where our cost exceeds all competitors AND market prices are falling\. Urgent clearance needed\./g,
  'Products where our cost exceeds lowest competitor AND market prices are falling. Risk of being undercut.'
);

// Write back to file
fs.writeFileSync(filePath, fixedContent);

console.log('Fixed cost risk logic - now compares against lowest competitor instead of highest'); 