-- Daily Rep Performance Table Functions
-- Provides rep-level aggregation with telesales profit percentage and comparison data

-- Function to get rep performance data for a given period
CREATE OR REPLACE FUNCTION get_daily_rep_performance(
    start_date DATE,
    end_date DATE,
    department_filter TEXT[] DEFAULT NULL,
    method_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    rep_name TEXT,
    total_spend DECIMAL,
    total_profit DECIMAL,
    avg_margin DECIMAL,
    account_names TEXT,
    total_telesales_profit DECIMAL,
    telesales_profit_percentage DECIMAL,
    record_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d."Rep" as rep_name,
        COALESCE(SUM(d."Spend"), 0)::DECIMAL as total_spend,
        COALESCE(SUM(d."Profit"), 0)::DECIMAL as total_profit,
        COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE 0 END), 0)::DECIMAL as avg_margin,
        STRING_AGG(DISTINCT d."Account Name", ', ' ORDER BY d."Account Name") as account_names,
        COALESCE(SUM(CASE WHEN d."Method" = 'telesales' THEN d."Profit" ELSE 0 END), 0)::DECIMAL as total_telesales_profit,
        COALESCE((SUM(CASE WHEN d."Method" = 'telesales' THEN d."Profit" ELSE 0 END) / NULLIF(SUM(d."Profit"), 0)) * 100, 0)::DECIMAL as telesales_profit_percentage,
        COUNT(*)::INTEGER as record_count
    FROM "Daily_Data" d
    WHERE d."Date_Time"::DATE BETWEEN start_date AND end_date
        AND (department_filter IS NULL OR 
             (array_length(department_filter, 1) > 0 AND d."Department" = ANY(department_filter)))
        AND (method_filter IS NULL OR d."Method" = method_filter)
        AND d."Account Name" IS NOT NULL
    GROUP BY d."Rep"
    HAVING COUNT(*) > 0
    ORDER BY total_profit DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get rep performance comparison data (current vs previous period)
CREATE OR REPLACE FUNCTION get_daily_rep_performance_comparison(
    current_start DATE,
    current_end DATE,
    comparison_start DATE,
    comparison_end DATE,
    department_filter TEXT[] DEFAULT NULL,
    method_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    rep_name TEXT,
    -- Current period data
    current_spend DECIMAL,
    current_profit DECIMAL,
    current_margin DECIMAL,
    current_account_names TEXT,
    current_telesales_profit DECIMAL,
    current_telesales_percentage DECIMAL,
    -- Comparison period data
    comparison_spend DECIMAL,
    comparison_profit DECIMAL,
    comparison_margin DECIMAL,
    comparison_account_names TEXT,
    comparison_telesales_profit DECIMAL,
    comparison_telesales_percentage DECIMAL,
    -- Change calculations
    spend_change_percent DECIMAL,
    profit_change_percent DECIMAL,
    margin_change_percent DECIMAL,
    accounts_change_percent DECIMAL,
    telesales_percentage_change_percent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH current_data AS (
        SELECT * FROM get_daily_rep_performance(
            current_start, current_end, department_filter, method_filter
        )
    ),
    comparison_data AS (
        SELECT * FROM get_daily_rep_performance(
            comparison_start, comparison_end, department_filter, method_filter
        )
    ),
    all_reps AS (
        SELECT DISTINCT rep_name FROM (
            SELECT rep_name FROM current_data
            UNION
            SELECT rep_name FROM comparison_data
        ) combined_reps
    )
    SELECT 
        ar.rep_name,
        -- Current period (with defaults for missing reps)
        COALESCE(cd.total_spend, 0) as current_spend,
        COALESCE(cd.total_profit, 0) as current_profit,
        COALESCE(cd.avg_margin, 0) as current_margin,
        COALESCE(cd.account_names, '') as current_account_names,
        COALESCE(cd.total_telesales_profit, 0) as current_telesales_profit,
        COALESCE(cd.telesales_profit_percentage, 0) as current_telesales_percentage,
        -- Comparison period (with defaults for missing reps)
        COALESCE(cmd.total_spend, 0) as comparison_spend,
        COALESCE(cmd.total_profit, 0) as comparison_profit,
        COALESCE(cmd.avg_margin, 0) as comparison_margin,
        COALESCE(cmd.account_names, '') as comparison_account_names,
        COALESCE(cmd.total_telesales_profit, 0) as comparison_telesales_profit,
        COALESCE(cmd.telesales_profit_percentage, 0) as comparison_telesales_percentage,
        -- Change calculations (percentage changes)
        CASE 
            WHEN COALESCE(cmd.total_spend, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.total_spend, 0) - COALESCE(cmd.total_spend, 0)) / cmd.total_spend) * 100
        END as spend_change_percent,
        CASE 
            WHEN COALESCE(cmd.total_profit, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.total_profit, 0) - COALESCE(cmd.total_profit, 0)) / cmd.total_profit) * 100
        END as profit_change_percent,
        CASE 
            WHEN COALESCE(cmd.avg_margin, 0) = 0 THEN 0
            ELSE COALESCE(cd.avg_margin, 0) - COALESCE(cmd.avg_margin, 0)
        END as margin_change_percent,
        -- For account names, we'll calculate based on the number of unique accounts
        CASE 
            WHEN COALESCE(array_length(string_to_array(cmd.account_names, ', '), 1), 0) = 0 THEN 0
            ELSE ((COALESCE(array_length(string_to_array(cd.account_names, ', '), 1), 0)::DECIMAL - COALESCE(array_length(string_to_array(cmd.account_names, ', '), 1), 0)::DECIMAL) / array_length(string_to_array(cmd.account_names, ', '), 1)) * 100
        END as accounts_change_percent,
        CASE 
            WHEN COALESCE(cmd.telesales_profit_percentage, 0) = 0 THEN 0
            ELSE COALESCE(cd.telesales_profit_percentage, 0) - COALESCE(cmd.telesales_profit_percentage, 0)
        END as telesales_percentage_change_percent
    FROM all_reps ar
    LEFT JOIN current_data cd ON ar.rep_name = cd.rep_name
    LEFT JOIN comparison_data cmd ON ar.rep_name = cmd.rep_name
    -- Only include reps that have data in at least one period
    WHERE COALESCE(cd.total_profit, 0) > 0 OR COALESCE(cmd.total_profit, 0) > 0
    ORDER BY COALESCE(cd.total_profit, 0) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_daily_rep_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_rep_performance_comparison TO authenticated; 