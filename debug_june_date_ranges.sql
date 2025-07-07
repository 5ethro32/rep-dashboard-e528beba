-- Debug script to investigate June date range differences
-- Checking what data exists for June 2025 and what our functions return

-- 1. Check what data exists in Daily_Data for June 2025
SELECT 
    DATE("Date_Time") as date,
    COUNT(*) as record_count,
    SUM("Spend") as total_spend,
    SUM("Profit") as total_profit,
    AVG(CASE WHEN "Spend" > 0 THEN ("Profit" / "Spend") * 100 ELSE 0 END) as avg_margin,
    COUNT(DISTINCT "Account Ref") as unique_accounts
FROM "Daily_Data"
WHERE "Date_Time"::DATE >= '2025-06-01' 
AND "Date_Time"::DATE <= '2025-06-30'
GROUP BY DATE("Date_Time")
ORDER BY date;

-- 2. Check total aggregated data for June 2025 (what should match the dashboard)
SELECT 
    'June 2025 Total' as period,
    COUNT(*) as record_count,
    SUM("Spend") as total_spend,
    SUM("Profit") as total_profit,
    AVG(CASE WHEN "Spend" > 0 THEN ("Profit" / "Spend") * 100 ELSE 0 END) as avg_margin,
    COUNT(DISTINCT "Account Ref") as unique_accounts
FROM "Daily_Data"
WHERE "Date_Time"::DATE >= '2025-06-01' 
AND "Date_Time"::DATE <= '2025-06-30';

-- 3. Test our SQL function with exact June dates
SELECT * FROM get_daily_summary_metrics(
    '2025-06-01'::DATE,
    '2025-06-30'::DATE,
    NULL, -- department_filter
    NULL  -- method_filter
);

-- 4. Check if there's data outside June that might be included
SELECT 
    DATE("Date_Time") as date,
    COUNT(*) as record_count
FROM "Daily_Data"
WHERE "Date_Time"::DATE >= '2025-05-25' 
AND "Date_Time"::DATE <= '2025-07-05'
GROUP BY DATE("Date_Time")
ORDER BY date;

-- 5. Check for any timezone or time formatting issues
SELECT 
    "Date_Time",
    DATE("Date_Time") as just_date,
    "Spend",
    "Profit"
FROM "Daily_Data"
WHERE "Date_Time"::DATE = '2025-06-01'
LIMIT 10; 