-- Migration: Daily Rep Performance Data Aggregation Functions
-- This migration adds server-side aggregation functions to handle large datasets efficiently

-- Function to get aggregated daily data based on date range
CREATE OR REPLACE FUNCTION get_daily_aggregated_data(
    start_date DATE,
    end_date DATE,
    department_filter TEXT DEFAULT NULL,
    method_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    period_label TEXT,
    total_spend DECIMAL,
    total_cost DECIMAL,
    total_credit DECIMAL,
    total_profit DECIMAL,
    avg_margin DECIMAL,
    total_packs INTEGER,
    unique_accounts INTEGER,
    record_count INTEGER
) AS $$
DECLARE
    date_diff INTEGER;
    aggregation_type TEXT;
BEGIN
    -- Calculate date difference to determine aggregation strategy
    date_diff := end_date - start_date;
    
    -- Determine aggregation type based on date range
    IF date_diff <= 1 THEN
        aggregation_type := 'hourly';
    ELSIF date_diff <= 7 THEN
        aggregation_type := 'daily';
    ELSIF date_diff <= 30 THEN
        aggregation_type := 'daily';
    ELSE
        aggregation_type := 'weekly';
    END IF;
    
    -- Return aggregated data based on type
    IF aggregation_type = 'hourly' THEN
        RETURN QUERY
        SELECT 
            date_trunc('hour', "Date_Time") AS period_start,
            date_trunc('hour', "Date_Time") + INTERVAL '1 hour' AS period_end,
            to_char(date_trunc('hour', "Date_Time"), 'HH24:MI') AS period_label,
            COALESCE(SUM("Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM("Cost"), 0)::DECIMAL AS total_cost,
            COALESCE(SUM("Credit"), 0)::DECIMAL AS total_credit,
            COALESCE(SUM("Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN "Spend" > 0 THEN ("Profit" / "Spend") * 100 ELSE 0 END), 0)::DECIMAL AS avg_margin,
            COALESCE(SUM("Packs"), 0)::INTEGER AS total_packs,
            COUNT(DISTINCT "Account Ref")::INTEGER AS unique_accounts,
            COUNT(*)::INTEGER AS record_count
        FROM "Daily_Data"
        WHERE "Date_Time"::DATE BETWEEN start_date AND end_date
            AND (department_filter IS NULL OR "Department" = department_filter)
            AND (method_filter IS NULL OR "Method" = method_filter)
        GROUP BY date_trunc('hour', "Date_Time")
        ORDER BY period_start;
        
    ELSIF aggregation_type = 'daily' THEN
        RETURN QUERY
        SELECT 
            date_trunc('day', "Date_Time") AS period_start,
            date_trunc('day', "Date_Time") + INTERVAL '1 day' AS period_end,
            to_char(date_trunc('day', "Date_Time"), 'DD/MM') AS period_label,
            COALESCE(SUM("Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM("Cost"), 0)::DECIMAL AS total_cost,
            COALESCE(SUM("Credit"), 0)::DECIMAL AS total_credit,
            COALESCE(SUM("Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN "Spend" > 0 THEN ("Profit" / "Spend") * 100 ELSE 0 END), 0)::DECIMAL AS avg_margin,
            COALESCE(SUM("Packs"), 0)::INTEGER AS total_packs,
            COUNT(DISTINCT "Account Ref")::INTEGER AS unique_accounts,
            COUNT(*)::INTEGER AS record_count
        FROM "Daily_Data"
        WHERE "Date_Time"::DATE BETWEEN start_date AND end_date
            AND (department_filter IS NULL OR "Department" = department_filter)
            AND (method_filter IS NULL OR "Method" = method_filter)
        GROUP BY date_trunc('day', "Date_Time")
        ORDER BY period_start;
        
    ELSE -- weekly aggregation
        RETURN QUERY
        SELECT 
            date_trunc('week', "Date_Time") AS period_start,
            date_trunc('week', "Date_Time") + INTERVAL '1 week' AS period_end,
            'Week ' || to_char(date_trunc('week', "Date_Time"), 'WW') AS period_label,
            COALESCE(SUM("Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM("Cost"), 0)::DECIMAL AS total_cost,
            COALESCE(SUM("Credit"), 0)::DECIMAL AS total_credit,
            COALESCE(SUM("Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN "Spend" > 0 THEN ("Profit" / "Spend") * 100 ELSE 0 END), 0)::DECIMAL AS avg_margin,
            COALESCE(SUM("Packs"), 0)::INTEGER AS total_packs,
            COUNT(DISTINCT "Account Ref")::INTEGER AS unique_accounts,
            COUNT(*)::INTEGER AS record_count
        FROM "Daily_Data"
        WHERE "Date_Time"::DATE BETWEEN start_date AND end_date
            AND (department_filter IS NULL OR "Department" = department_filter)
            AND (method_filter IS NULL OR "Method" = method_filter)
        GROUP BY date_trunc('week', "Date_Time")
        ORDER BY period_start;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get summary metrics for a specific date range
CREATE OR REPLACE FUNCTION get_daily_summary_metrics(
    start_date DATE,
    end_date DATE,
    department_filter TEXT DEFAULT NULL,
    method_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_spend DECIMAL,
    total_cost DECIMAL,
    total_credit DECIMAL,
    total_profit DECIMAL,
    avg_margin DECIMAL,
    total_packs INTEGER,
    unique_accounts INTEGER,
    total_records INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM("Spend"), 0)::DECIMAL AS total_spend,
        COALESCE(SUM("Cost"), 0)::DECIMAL AS total_cost,
        COALESCE(SUM("Credit"), 0)::DECIMAL AS total_credit,
        COALESCE(SUM("Profit"), 0)::DECIMAL AS total_profit,
        COALESCE(AVG(CASE WHEN "Spend" > 0 THEN ("Profit" / "Spend") * 100 ELSE 0 END), 0)::DECIMAL AS avg_margin,
        COALESCE(SUM("Packs"), 0)::INTEGER AS total_packs,
        COUNT(DISTINCT "Account Ref")::INTEGER AS unique_accounts,
        COUNT(*)::INTEGER AS total_records
    FROM "Daily_Data"
    WHERE "Date_Time"::DATE BETWEEN start_date AND end_date
        AND (department_filter IS NULL OR "Department" = department_filter)
        AND (method_filter IS NULL OR "Method" = method_filter);
END;
$$ LANGUAGE plpgsql;

-- Function to get comparison period data for period-over-period analysis
CREATE OR REPLACE FUNCTION get_daily_comparison_metrics(
    current_start DATE,
    current_end DATE,
    comparison_start DATE,
    comparison_end DATE,
    department_filter TEXT DEFAULT NULL,
    method_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    current_spend DECIMAL,
    current_profit DECIMAL,
    current_margin DECIMAL,
    current_accounts INTEGER,
    comparison_spend DECIMAL,
    comparison_profit DECIMAL,
    comparison_margin DECIMAL,
    comparison_accounts INTEGER,
    spend_change DECIMAL,
    profit_change DECIMAL,
    margin_change DECIMAL,
    accounts_change INTEGER
) AS $$
DECLARE
    curr_metrics RECORD;
    comp_metrics RECORD;
BEGIN
    -- Get current period metrics
    SELECT * INTO curr_metrics FROM get_daily_summary_metrics(
        current_start, current_end, department_filter, method_filter
    );
    
    -- Get comparison period metrics
    SELECT * INTO comp_metrics FROM get_daily_summary_metrics(
        comparison_start, comparison_end, department_filter, method_filter
    );
    
    RETURN QUERY
    SELECT 
        curr_metrics.total_spend AS current_spend,
        curr_metrics.total_profit AS current_profit,
        curr_metrics.avg_margin AS current_margin,
        curr_metrics.unique_accounts AS current_accounts,
        comp_metrics.total_spend AS comparison_spend,
        comp_metrics.total_profit AS comparison_profit,
        comp_metrics.avg_margin AS comparison_margin,
        comp_metrics.unique_accounts AS comparison_accounts,
        (curr_metrics.total_spend - comp_metrics.total_spend) AS spend_change,
        (curr_metrics.total_profit - comp_metrics.total_profit) AS profit_change,
        (curr_metrics.avg_margin - comp_metrics.avg_margin) AS margin_change,
        (curr_metrics.unique_accounts - comp_metrics.unique_accounts) AS accounts_change;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_daily_aggregated_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_summary_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_comparison_metrics TO authenticated; 