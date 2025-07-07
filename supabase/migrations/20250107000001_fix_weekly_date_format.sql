-- Migration: Fix weekly date format to show actual dates instead of week numbers
-- This updates the get_monthly_trends_data function to display DD/MM format for weekly aggregation

CREATE OR REPLACE FUNCTION get_monthly_trends_data(
    time_range_type TEXT,
    department_filter TEXT DEFAULT NULL,
    method_filter TEXT DEFAULT NULL,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    period_label TEXT,
    full_period_label TEXT,
    total_spend DECIMAL,
    total_profit DECIMAL,
    avg_margin DECIMAL,
    unique_accounts INTEGER,
    is_projected BOOLEAN,
    is_partial BOOLEAN,
    period_date DATE,
    record_count INTEGER
) AS $$
DECLARE
    start_date DATE;
    current_date DATE := end_date;
    aggregation_type TEXT;
    date_diff INTEGER;
BEGIN
    -- Calculate start date based on time range type
    CASE time_range_type
        WHEN '5D' THEN
            start_date := current_date - INTERVAL '4 days';
            aggregation_type := 'daily';
        WHEN '1M' THEN
            start_date := current_date - INTERVAL '1 month';
            aggregation_type := 'daily';
        WHEN '3M' THEN
            start_date := current_date - INTERVAL '3 months';
            aggregation_type := 'weekly';
        WHEN 'MTD' THEN
            start_date := date_trunc('month', current_date)::DATE;
            aggregation_type := 'daily';
        WHEN 'YTD' THEN
            start_date := date_trunc('year', current_date)::DATE;
            aggregation_type := 'monthly';
        WHEN 'ALL' THEN
            -- Get earliest date from the data
            SELECT MIN("Date_Time"::DATE) INTO start_date FROM "Daily_Data";
            -- If no data, fallback to 1 year ago
            IF start_date IS NULL THEN
                start_date := current_date - INTERVAL '1 year';
            END IF;
            aggregation_type := 'monthly';
        ELSE
            -- Default to 1 month
            start_date := current_date - INTERVAL '1 month';
            aggregation_type := 'daily';
    END CASE;

    -- Return aggregated data based on type
    IF aggregation_type = 'daily' THEN
        RETURN QUERY
        SELECT 
            date_trunc('day', d."Date_Time") AS period_start,
            date_trunc('day', d."Date_Time") + INTERVAL '1 day' AS period_end,
            to_char(date_trunc('day', d."Date_Time"), 'DD/MM') AS period_label,
            to_char(date_trunc('day', d."Date_Time"), 'DD/MM/YYYY') AS full_period_label,
            COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE 0 END), 0)::DECIMAL AS avg_margin,
            COUNT(DISTINCT d."Account Ref")::INTEGER AS unique_accounts,
            FALSE AS is_projected,
            (date_trunc('day', d."Date_Time")::DATE = current_date) AS is_partial,
            date_trunc('day', d."Date_Time")::DATE AS period_date,
            COUNT(*)::INTEGER AS record_count
        FROM "Daily_Data" d
        WHERE d."Date_Time"::DATE BETWEEN start_date AND current_date
            AND (department_filter IS NULL OR d."Department" = department_filter)
            AND (method_filter IS NULL OR d."Method" = method_filter)
        GROUP BY date_trunc('day', d."Date_Time")
        ORDER BY period_start;
        
    ELSIF aggregation_type = 'weekly' THEN
        RETURN QUERY
        SELECT 
            date_trunc('week', d."Date_Time") AS period_start,
            date_trunc('week', d."Date_Time") + INTERVAL '1 week' AS period_end,
            to_char(date_trunc('week', d."Date_Time"), 'DD/MM') AS period_label,
            'Week of ' || to_char(date_trunc('week', d."Date_Time"), 'DD/MM/YYYY') AS full_period_label,
            COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE 0 END), 0)::DECIMAL AS avg_margin,
            COUNT(DISTINCT d."Account Ref")::INTEGER AS unique_accounts,
            FALSE AS is_projected,
            (date_trunc('week', d."Date_Time")::DATE <= current_date - INTERVAL '1 week') AS is_partial,
            date_trunc('week', d."Date_Time")::DATE AS period_date,
            COUNT(*)::INTEGER AS record_count
        FROM "Daily_Data" d
        WHERE d."Date_Time"::DATE BETWEEN start_date AND current_date
            AND (department_filter IS NULL OR d."Department" = department_filter)
            AND (method_filter IS NULL OR d."Method" = method_filter)
        GROUP BY date_trunc('week', d."Date_Time")
        ORDER BY period_start;
        
    ELSE -- monthly aggregation
        RETURN QUERY
        SELECT 
            date_trunc('month', d."Date_Time") AS period_start,
            date_trunc('month', d."Date_Time") + INTERVAL '1 month' AS period_end,
            to_char(date_trunc('month', d."Date_Time"), 'Mon') AS period_label,
            to_char(date_trunc('month', d."Date_Time"), 'Mon YYYY') AS full_period_label,
            COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE 0 END), 0)::DECIMAL AS avg_margin,
            COUNT(DISTINCT d."Account Ref")::INTEGER AS unique_accounts,
            FALSE AS is_projected,
            (date_trunc('month', d."Date_Time")::DATE = date_trunc('month', current_date)::DATE) AS is_partial,
            date_trunc('month', d."Date_Time")::DATE AS period_date,
            COUNT(*)::INTEGER AS record_count
        FROM "Daily_Data" d
        WHERE d."Date_Time"::DATE BETWEEN start_date AND current_date
            AND (department_filter IS NULL OR d."Department" = department_filter)
            AND (method_filter IS NULL OR d."Method" = method_filter)
        GROUP BY date_trunc('month', d."Date_Time")
        ORDER BY period_start;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_trends_data TO authenticated; 