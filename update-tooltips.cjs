const fs = require('fs');
const path = './src/pages/engine-room/InventoryAnalytics.tsx';

// Read the file
let content = fs.readFileSync(path, 'utf8');

// Replace all occurrences of the AAH trend logic with the full competitor logic
const oldLogic = `          // Add AAH trend information if this is AAH and we have trend data
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              // Add trend on same line or next line
              const trendParts = trendInfo.split('\\n');
              const trendSummary = trendParts.find(part => part.includes('↑') || part.includes('↓') || part.includes('−') || part.includes('🆕'));
              if (trendSummary) {
                line += \` - \${trendSummary}\`;
              }
            }
          }`;

const newLogic = `          // Add trend information for each competitor if available
          if (comp.name === 'AAH' && shouldShowAAHTrendTooltip(item)) {
            const trendInfo = getAAHTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          } else if (comp.name === 'Nupharm' && shouldShowNupharmTrendTooltip(item)) {
            const trendInfo = getNupharmTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          } else if (comp.name === 'ETH NET' && shouldShowETHNetTrendTooltip(item)) {
            const trendInfo = getETHNetTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          } else if (comp.name === 'LEXON' && shouldShowLexonTrendTooltip(item)) {
            const trendInfo = getLexonTrendTooltip(item);
            if (trendInfo) {
              line += \` - \${trendInfo}\`;
            }
          }`;

// Replace all occurrences
content = content.replace(new RegExp(oldLogic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLogic);

// Write the updated content back
fs.writeFileSync(path, content, 'utf8');
console.log('Updated all competitor trend tooltip occurrences.'); 