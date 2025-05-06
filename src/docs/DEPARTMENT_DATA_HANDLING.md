# Department Data Attribution in Rep Performance Dashboard

## Department Structure

The reporting dashboard handles three main departments:
- **Retail**
- **REVA**
- **Wholesale**

## Data Attribution Rules

When data is processed for the rep performance tables, attribution follows these rules:

1. **Retail Department**: 
   - Data is attributed to the main rep (rep_name field)
   - This is shown directly in the "Retail" tab and contributes to the "Overall" tab

2. **REVA Department**:
   - Data is attributed to the sub-rep (sub_rep field) when available
   - When viewing the "REVA" tab, you see each sub-rep's individual contribution
   - When viewing the "Overall" tab, each sub-rep's REVA sales are included in their total numbers
   - If no sub-rep is specified, data falls back to using the rep_name

3. **Wholesale Department**:
   - Functions exactly like REVA: data is attributed to the sub-rep
   - The "Wholesale" tab shows each sub-rep's contribution
   - The "Overall" tab includes each sub-rep's Wholesale sales in their total numbers
   - If no sub-rep is specified, data falls back to using the rep_name

## Department Name Filtering

The system filters out cases where department names ("REVA", "Wholesale", "Retail") are incorrectly entered as rep names. This prevents department names from appearing as individual reps in the tables.

## Implementation Details

The attribution logic is implemented in the `convertDataFormat` function within `useEnhancedPerformanceData.tsx`:

```typescript
// Determine which rep name to use based on the department
let repName;
const department = (item.department || '').toLowerCase();

// For REVA and Wholesale departments, use sub_rep when available
if (department.includes('reva') || department.includes('wholesale')) {
  repName = item.sub_rep || item.rep_name; // Fallback to rep_name if sub_rep is not available
} else {
  // For Retail or any other department, use rep_name
  repName = item.rep_name;
}

// Filter out department names incorrectly entered as rep names
const normalizedRepName = repName.toLowerCase();
if (normalizedRepName === 'reva' || 
    normalizedRepName === 'wholesale' || 
    normalizedRepName === 'retail') {
  console.log(`Skipping department name "${repName}" used as rep name in data`);
  return;
}
```

## Example

For a rep like "Craig McDowall":
- The "Overall" tab shows his combined sales from all departments
- The "Retail" tab shows only his direct retail sales 
- The "REVA" tab shows all sub-reps for the REVA department (Craig may appear here if he's a sub-rep)
- The "Wholesale" tab shows all sub-reps for the Wholesale department

## Toggles

The department toggles at the top affect which data is included:
- When all departments are enabled, the "Overall" position shows the complete picture
- When only specific departments are enabled, metrics are filtered accordingly 