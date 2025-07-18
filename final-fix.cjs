const fs = require('fs');

// Read the file
const filePath = './src/pages/engine-room/InventoryAnalytics.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Remove all instances of the cellRenderer line
const fixedContent = content.replace(
  /\s*cellRenderer: 'agGroupCellRenderer',\s*\/\/ Enable expand\/collapse functionality\n/g,
  ''
);

// Write back to file
fs.writeFileSync(filePath, fixedContent);

console.log('Fixed all agGroupCellRenderer instances'); 