const fs = require('fs');

// Read the file
let content = fs.readFileSync('./src/pages/engine-room/InventoryAnalytics.tsx', 'utf8');

// Fix MetricFilteredAGGrid (line 8694)
content = content.replace(
  `          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += \` \${trendInfo}\`;
            }
          }`,
  `          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          } else if (comp.name === 'PHX' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          } else if (comp.name === 'ETHN' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          } else if (comp.name === 'LEX' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          }`
);

// Write back to file
fs.writeFileSync('./src/pages/engine-room/InventoryAnalytics.tsx', content, 'utf8');

console.log('Successfully fixed all remaining AG Grid tooltips!'); 