-- Force update of Daily Rep Performance Functions
-- Ensure active/total account counts are working properly

-- Drop existing functions completely
DROP FUNCTION IF EXISTS get_daily_rep_performance(DATE, DATE, TEXT[], TEXT);
DROP FUNCTION IF EXISTS get_daily_rep_performance_comparison(DATE, DATE, DATE, DATE, TEXT[], TEXT);

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
    active_accounts INTEGER,
    total_accounts INTEGER,
    total_telesales_profit DECIMAL,
    telesales_profit_percentage DECIMAL,
    record_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH rep_assignments AS (
        -- Get all accounts assigned to each rep (via Rep or Sub-Rep field, no duplicates)
        -- Use last 12 months to get comprehensive assignment data
        SELECT DISTINCT
            CASE 
                WHEN d."Department" IN ('REVA', 'Wholesale', 'WHOLESALE') AND d."Sub-Rep" IS NOT NULL AND d."Sub-Rep" != ''
                THEN d."Sub-Rep"
                ELSE d."Rep"
            END as rep_name,
            d."Account Ref" as account_ref,
            d."Account Name" as account_name
        FROM "Daily_Data" d
        WHERE d."Account Ref" IS NOT NULL 
            AND d."Account Name" IS NOT NULL
            AND d."Date_Time"::DATE >= start_date - INTERVAL '12 months'
            AND (department_filter IS NULL OR 
                 (array_length(department_filter, 1) > 0 AND d."Department" = ANY(department_filter)))
    ),
    active_transactions AS (
        -- Get transactions in the specified period
        SELECT 
            CASE 
                WHEN d."Department" IN ('REVA', 'Wholesale', 'WHOLESALE') AND d."Sub-Rep" IS NOT NULL AND d."Sub-Rep" != ''
                THEN d."Sub-Rep"
                ELSE d."Rep"
            END as rep_name,
            d."Account Ref" as account_ref,
            d."Spend",
            d."Profit",
            d."Method"
        FROM "Daily_Data" d
        WHERE d."Date_Time"::DATE BETWEEN start_date AND end_date
            AND (department_filter IS NULL OR 
                 (array_length(department_filter, 1) > 0 AND d."Department" = ANY(department_filter)))
            AND (method_filter IS NULL OR d."Method" = method_filter)
            AND d."Account Ref" IS NOT NULL
    )
    SELECT 
        ra.rep_name,
        COALESCE(SUM(at."Spend"), 0)::DECIMAL as total_spend,
        COALESCE(SUM(at."Profit"), 0)::DECIMAL as total_profit,
        COALESCE(AVG(CASE WHEN at."Spend" > 0 THEN (at."Profit" / at."Spend") * 100 ELSE 0 END), 0)::DECIMAL as avg_margin,
        COUNT(DISTINCT at.account_ref)::INTEGER as active_accounts,
        COUNT(DISTINCT ra.account_ref)::INTEGER as total_accounts,
        COALESCE(SUM(CASE WHEN at."Method" = 'telesales' THEN at."Profit" ELSE 0 END), 0)::DECIMAL as total_telesales_profit,
        COALESCE((SUM(CASE WHEN at."Method" = 'telesales' THEN at."Profit" ELSE 0 END) / NULLIF(SUM(at."Profit"), 0)) * 100, 0)::DECIMAL as telesales_profit_percentage,
        COUNT(at.account_ref)::INTEGER as record_count
    FROM rep_assignments ra
    LEFT JOIN active_transactions at ON ra.rep_name = at.rep_name AND ra.account_ref = at.account_ref
    WHERE ra.rep_name IS NOT NULL AND ra.rep_name != ''
    GROUP BY ra.rep_name
    HAVING COUNT(DISTINCT ra.account_ref) > 0
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
    current_active_accounts INTEGER,
    current_total_accounts INTEGER,
    current_telesales_profit DECIMAL,
    current_telesales_percentage DECIMAL,
    -- Comparison period data
    comparison_spend DECIMAL,
    comparison_profit DECIMAL,
    comparison_margin DECIMAL,
    comparison_active_accounts INTEGER,
    comparison_total_accounts INTEGER,
    comparison_telesales_profit DECIMAL,
    comparison_telesales_percentage DECIMAL,
    -- Change calculations
    spend_change_percent DECIMAL,
    profit_change_percent DECIMAL,
    margin_change_percent DECIMAL,
    active_accounts_change_percent DECIMAL,
    total_accounts_change_percent DECIMAL,
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
        COALESCE(cd.active_accounts, 0) as current_active_accounts,
        COALESCE(cd.total_accounts, 0) as current_total_accounts,
        COALESCE(cd.total_telesales_profit, 0) as current_telesales_profit,
        COALESCE(cd.telesales_profit_percentage, 0) as current_telesales_percentage,
        -- Comparison period (with defaults for missing reps)
        COALESCE(cmd.total_spend, 0) as comparison_spend,
        COALESCE(cmd.total_profit, 0) as comparison_profit,
        COALESCE(cmd.avg_margin, 0) as comparison_margin,
        COALESCE(cmd.active_accounts, 0) as comparison_active_accounts,
        COALESCE(cmd.total_accounts, 0) as comparison_total_accounts,
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
        -- Active accounts change
        CASE 
            WHEN COALESCE(cmd.active_accounts, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.active_accounts, 0)::DECIMAL - COALESCE(cmd.active_accounts, 0)::DECIMAL) / cmd.active_accounts) * 100
        END as active_accounts_change_percent,
        -- Total accounts change
        CASE 
            WHEN COALESCE(cmd.total_accounts, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.total_accounts, 0)::DECIMAL - COALESCE(cmd.total_accounts, 0)::DECIMAL) / cmd.total_accounts) * 100
        END as total_accounts_change_percent,
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
