# Daily Rep Performance Dashboard - Implementation Plan

## Project Overview

### Objective
Create a new Daily Rep Performance Dashboard that duplicates the existing Rep Performance page functionality but operates on daily-level transaction data from the `Daily_Data` table, enabling real-time performance analysis with time-series capabilities.

### Key Differences from Current Implementation
- **Data Source**: `Daily_Data` table (70k records, 6 months)
- **Time Selection**: Calendar date picker instead of month dropdown
- **Granularity**: Daily transactions with timestamp data
- **New Metric**: EDI Profit (replacing Packs) - profit from telesales method
- **Comparison Logic**: Period-over-period comparisons (MTD vs Previous MTD, etc.)

## Architecture & Design Decisions

### 1. Database Schema Analysis
```sql
-- Daily_Data table structure
TABLE public."Daily_Data" (
  id text PRIMARY KEY,
  "Rep" text NOT NULL,
  "Sub-Rep" text,
  "Department" text,
  "Account Ref" text,
  "Account Name" text,
  "Spend" numeric,
  "Cost" numeric,
  "Credit" numeric,
  "Profit" numeric,
  "Margin" numeric,
  "Packs" numeric,
  "Method" text, -- 'edi' | 'telesales'
  "Date_Time" timestamptz
);

-- Existing indices
INDEX "Daily_Data_Rep_idx" ON "Rep"
INDEX "Daily_Data_Department_idx" ON "Department"
INDEX "Daily_Data_Account Ref_idx" ON "Account Ref"
```

### 2. Performance Considerations

#### Data Volume Analysis
- **Current**: 70k records over 6 months
- **Average**: ~390 records/day
- **Peak Load**: Assume 2-3x average for busy periods

#### Query Optimization Strategy
```sql
-- Recommended additional indices
CREATE INDEX IF NOT EXISTS "Daily_Data_Date_Time_idx" 
ON public."Daily_Data" USING btree ("Date_Time");

CREATE INDEX IF NOT EXISTS "Daily_Data_Method_idx" 
ON public."Daily_Data" USING btree ("Method");

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS "Daily_Data_composite_idx" 
ON public."Daily_Data" USING btree ("Date_Time", "Rep", "Department");
```

#### Client-Side Performance
- **No pagination needed**: 70k records = ~10-20MB (manageable)
- **Virtual scrolling**: Use existing `react-virtuoso` for rep tables
- **Memoized calculations**: Cache aggregations for filter combinations
- **Efficient date filtering**: Client-side filtering for small datasets

### 3. Technology Stack

#### New Dependencies
```json
{
  "react-tailwindcss-datepicker": "^2.0.0",
  "dayjs": "^1.11.12" // Already installed via date-fns
}
```

#### Component Architecture
```
src/
├── pages/
│   └── DailyRepPerformance.tsx (Main page)
├── components/
│   └── daily-rep-performance/
│       ├── DailyPerformanceHeader.tsx
│       ├── DailyPerformanceFilters.tsx
│       ├── DailySummaryMetrics.tsx
│       ├── DailyDatePicker.tsx
│       └── DailyPerformanceContent.tsx
├── hooks/
│   └── useDailyRepPerformanceData.tsx
├── services/
│   └── daily-rep-performance-service.ts
├── types/
│   └── daily-rep-performance.types.ts
└── utils/
    └── daily-date-utils.ts
```

## Implementation Phases

### Phase 1: Foundation & Core Infrastructure (Days 1-2) ✅ COMPLETE
- [x] Update Tailwind config for datepicker
- [x] Create type definitions
- [x] Implement date utilities with comparison logic
- [x] Create basic service layer
- [x] Add route configuration

### Phase 2: Core Components (Days 3-4) ✅ COMPLETE
- [x] Build DailyDatePicker component with shortcuts
- [x] Create DailySummaryMetrics with 4 cards (Revenue, Profit, Margin, EDI Profit)
- [x] Implement comprehensive data fetching hook
- [x] Create responsive filters component with method filtering

### Phase 3: Data Integration & Processing (Days 5-6)
- [ ] Implement comprehensive data service
- [ ] Build aggregation functions
- [ ] Add comparison period calculations
- [ ] Implement department filtering

### Phase 4: Advanced Features (Days 7-8)
- [ ] Add method filtering (EDI/Telesales)
- [ ] Implement rep-level data table
- [ ] Create trend analysis
- [ ] Add export functionality

### Phase 5: Testing & Optimization (Days 9-10)
- [ ] Performance testing with full dataset
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Integration testing

## Testing Strategy

### 1. Unit Tests
```typescript
// Example test structure
describe('DailyDateUtils', () => {
  test('getComparisonPeriod - MTD comparison', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-15');
    const comparison = getComparisonPeriod(start, end);
    
    expect(comparison.type).toBe('MTD');
    expect(comparison.comparison.start).toEqual(new Date('2024-12-01'));
    expect(comparison.comparison.end).toEqual(new Date('2024-12-15'));
  });
});

describe('DailyDataAggregation', () => {
  test('aggregateDailySummary - correct calculations', () => {
    const mockData = [
      { Rep: 'John', Spend: 1000, Profit: 150, Method: 'telesales' },
      { Rep: 'Jane', Spend: 2000, Profit: 300, Method: 'edi' }
    ];
    
    const result = aggregateDailySummary(mockData);
    expect(result.totalSpend).toBe(3000);
    expect(result.totalProfit).toBe(450);
    expect(result.ediProfit).toBe(150);
    expect(result.averageMargin).toBeCloseTo(15);
  });
});
```

### 2. Integration Tests
- [ ] Date picker component integration
- [ ] Data fetching with various date ranges
- [ ] Filter combinations (Department + Method)
- [ ] Comparison period calculations

### 3. Performance Tests
```typescript
// Performance test scenarios
describe('Performance Tests', () => {
  test('Large dataset filtering', async () => {
    const startTime = performance.now();
    const data = await fetchDailyData(lastMonth, today);
    const filtered = aggregateDailySummary(data, true, true, false);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // < 1 second
    expect(data.length).toBeGreaterThan(10000);
  });
});
```

### 4. User Acceptance Tests
- [ ] Calendar navigation intuitive
- [ ] Comparison data makes sense
- [ ] Visual consistency with existing pages
- [ ] Mobile experience acceptable
- [ ] Export functionality works

## Risk Assessment & Mitigation

### High Risk Areas

#### 1. Performance with Large Datasets
**Risk**: Client-side processing of 70k+ records  
**Mitigation**: 
- Implement progressive loading
- Add database-side aggregation for summary metrics
- Use Web Workers for heavy calculations if needed

#### 2. Date Comparison Logic Complexity
**Risk**: Incorrect period-over-period calculations  
**Mitigation**:
- Comprehensive unit tests for all date scenarios
- Manual validation against known data sets
- Industry-standard comparison methods

#### 3. UI/UX Consistency
**Risk**: Deviation from existing design language  
**Mitigation**:
- Reuse existing components where possible
- Pixel-perfect matching of current design
- Stakeholder review at each phase

### Medium Risk Areas

#### 4. Data Quality Issues
**Risk**: Missing or inconsistent data in Daily_Data table  
**Mitigation**:
- Data validation and cleansing functions
- Graceful handling of null/missing values
- Clear error messages for data issues

## Database Optimizations

### Recommended Indices
```sql
-- Add these indices for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Daily_Data_Date_Time_idx" 
ON public."Daily_Data" USING btree ("Date_Time");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Daily_Data_Method_idx" 
ON public."Daily_Data" USING btree ("Method");

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Daily_Data_perf_idx" 
ON public."Daily_Data" USING btree ("Date_Time", "Department", "Rep");
```

### Query Patterns
```sql
-- Typical queries we'll be running
-- 1. Date range with department filter
SELECT * FROM "Daily_Data" 
WHERE "Date_Time" >= $1 AND "Date_Time" <= $2
  AND "Department" = ANY($3)
ORDER BY "Date_Time" DESC;

-- 2. Aggregation by rep
SELECT "Rep", 
       SUM("Spend") as total_spend,
       SUM("Profit") as total_profit,
       SUM(CASE WHEN "Method" = 'telesales' THEN "Profit" ELSE 0 END) as edi_profit
FROM "Daily_Data" 
WHERE "Date_Time" >= $1 AND "Date_Time" <= $2
GROUP BY "Rep";
```

## Monitoring & Analytics

### Key Metrics to Track
- Page load time
- Data fetch duration
- Client-side aggregation performance
- User interaction patterns
- Date range selection frequency

### Performance Benchmarks
- Initial page load: < 2 seconds
- Date range change: < 1 second
- Filter application: < 500ms
- Export generation: < 5 seconds

## Rollout Strategy

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Internal team testing
- Performance validation

### Phase 2: Beta Release (Week 2)
- Limited user access
- Feedback collection
- Bug fixes and optimizations

### Phase 3: Full Release (Week 3)
- General availability
- Monitor usage patterns
- Continuous optimization

## Success Criteria

### Functional Requirements
- [ ] All metric cards display correct data
- [ ] Date picker works intuitively
- [ ] Comparisons are accurate
- [ ] Filters work correctly
- [ ] Export functionality complete

### Performance Requirements
- [ ] Page loads in < 2 seconds
- [ ] Handles 70k+ records smoothly
- [ ] Responsive on mobile devices
- [ ] Memory usage < 100MB

### User Experience Requirements
- [ ] Visual consistency with existing pages
- [ ] Intuitive navigation
- [ ] Clear comparison indicators
- [ ] Helpful error messages

## Next Steps

1. **Stakeholder Approval**: Review and approve this plan
2. **Environment Setup**: Prepare development environment
3. **Database Optimization**: Add recommended indices
4. **Begin Implementation**: Start with Phase 1 foundation work

---

## Implementation Checklist

### Infrastructure
- [ ] Install react-tailwindcss-datepicker
- [ ] Update Tailwind configuration
- [ ] Add database indices
- [ ] Create type definitions
- [ ] Set up routing

### Core Development
- [ ] Build date picker component
- [ ] Create metric cards
- [ ] Implement data service
- [ ] Add comparison logic
- [ ] Build rep table

### Testing & Validation
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] User acceptance testing complete
- [ ] Cross-browser compatibility verified

### Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] User guide
- [ ] Performance tuning guide
- [ ] Troubleshooting guide

---

*Last Updated: January 2025*
*Author: Development Team*
*Status: Phase 2 Complete - Functional Daily Dashboard Live!* 