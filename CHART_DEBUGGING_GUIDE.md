# Chart Debugging Guide for Daily Rep Performance

## Issue
The charts are not appearing on the Daily Rep Performance page. We've created several test pages to help diagnose the issue.

## Test Pages to Check

### 1. Simple Chart Test
**URL:** http://localhost:8080/simple-chart-test

This page tests basic rendering with inline styles:
- A red square (tests basic HTML/CSS)
- Simple bar chart made with divs
- A fake donut chart using CSS gradients
- All using inline styles to rule out CSS issues

**What to check:** If you see colored shapes and bars, basic rendering works.

### 2. Donut Chart Test
**URL:** http://localhost:8080/donut-chart-test

This page tests the DonutChart component specifically:
- Shows test data
- Renders a single DonutChart component
- Uses the actual Recharts library

**What to check:** If the donut chart doesn't appear here, the issue is with Recharts.

### 3. Chart Test
**URL:** http://localhost:8080/chart-test

This page tests various rendering methods:
- Basic colored divs
- Simple bar chart with divs
- SVG test
- Component rendering

**What to check:** Multiple rendering methods to isolate the issue.

### 4. Daily Rep Performance Demo
**URL:** http://localhost:8080/daily-rep-performance-demo

This page shows all 4 charts with mock data:
- Profit Distribution (bar chart)
- Margin Comparison (bar chart)
- Profit Share by Rep (donut chart)
- Profit Share by Department (donut chart)

**What to check:** If charts work here but not on the main page, it's a data issue.

### 5. Daily Rep Performance (Main Page)
**URL:** http://localhost:8080/daily-rep-performance

The actual page that should show charts with real data from the database.

## Troubleshooting Steps

1. **Open Browser Console** (F12) and check for:
   - Red error messages
   - Failed network requests
   - Module loading errors

2. **Check each test page in order**:
   - Start with `/simple-chart-test`
   - If that works, try `/donut-chart-test`
   - Then `/daily-rep-performance-demo`

3. **Common Issues**:
   - **Recharts not loading**: Check if recharts is properly installed
   - **Data fetching**: Check the debug info on the main page
   - **CSS issues**: The inline styles test page should help identify this
   - **Component errors**: Console will show React errors

4. **If Nothing Renders**:
   - Check if the dev server is running: `npm run dev`
   - Check for TypeScript errors: `npx tsc --noEmit`
   - Try hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

## What Each Component Does

- **DailyProfitDistribution**: Bar chart showing profit by rep
- **DailyMarginComparison**: Bar chart showing margin percentages
- **DailyRepProfitShare**: Donut chart showing profit share by rep
- **DailyDepartmentProfitShare**: Donut chart showing profit by department

All use either:
- Plain CSS/HTML (bar charts)
- Recharts library (donut charts via DonutChart component)

## Next Steps

Based on which test pages work/fail:
- If simple-chart-test fails: React rendering issue
- If donut-chart-test fails: Recharts library issue
- If demo page fails: Component implementation issue
- If only main page fails: Data fetching issue