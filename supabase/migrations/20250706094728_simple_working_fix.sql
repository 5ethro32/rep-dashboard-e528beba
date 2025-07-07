-- Simple working fix - copy the exact working pattern from main function

DROP FUNCTION IF EXISTS get_daily_rep_performance_comparison(DATE, DATE, DATE, DATE, TEXT[], TEXT);

-- Simple comparison: just call the working function twice and combine
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
    current_spend DECIMAL,
    current_profit DECIMAL,
    current_margin DECIMAL,
    current_active_accounts INTEGER,
    current_total_accounts INTEGER,
    current_telesales_profit DECIMAL,
    current_telesales_percentage DECIMAL,
    comparison_spend DECIMAL,
    comparison_profit DECIMAL,
    comparison_margin DECIMAL,
    comparison_active_accounts INTEGER,
    comparison_total_accounts INTEGER,
    comparison_telesales_profit DECIMAL,
    comparison_telesales_percentage DECIMAL,
    spend_change_percent DECIMAL,
    profit_change_percent DECIMAL,
    margin_change_percent DECIMAL,
    active_accounts_change_percent DECIMAL,
    total_accounts_change_percent DECIMAL,
    telesales_percentage_change_percent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(cd.rep_name, comp.rep_name) as rep_name,
        COALESCE(cd.total_spend, 0) as current_spend,
        COALESCE(cd.total_profit, 0) as current_profit,
        COALESCE(cd.avg_margin, 0) as current_margin,
        COALESCE(cd.active_accounts, 0) as current_active_accounts,
        COALESCE(cd.total_accounts, 0) as current_total_accounts,
        COALESCE(cd.total_telesales_profit, 0) as current_telesales_profit,
        COALESCE(cd.telesales_profit_percentage, 0) as current_telesales_percentage,
        COALESCE(comp.total_spend, 0) as comparison_spend,
        COALESCE(comp.total_profit, 0) as comparison_profit,
        COALESCE(comp.avg_margin, 0) as comparison_margin,
        COALESCE(comp.active_accounts, 0) as comparison_active_accounts,
        COALESCE(comp.total_accounts, 0) as comparison_total_accounts,
        COALESCE(comp.total_telesales_profit, 0) as comparison_telesales_profit,
        COALESCE(comp.telesales_profit_percentage, 0) as comparison_telesales_percentage,
        -- Changes
        CASE 
            WHEN COALESCE(comp.total_spend, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.total_spend, 0) - COALESCE(comp.total_spend, 0)) / comp.total_spend) * 100
        END::DECIMAL as spend_change_percent,
        CASE 
            WHEN COALESCE(comp.total_profit, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.total_profit, 0) - COALESCE(comp.total_profit, 0)) / comp.total_profit) * 100
        END::DECIMAL as profit_change_percent,
        (COALESCE(cd.avg_margin, 0) - COALESCE(comp.avg_margin, 0))::DECIMAL as margin_change_percent,
        CASE 
            WHEN COALESCE(comp.active_accounts, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.active_accounts, 0)::DECIMAL - COALESCE(comp.active_accounts, 0)::DECIMAL) / comp.active_accounts) * 100
        END::DECIMAL as active_accounts_change_percent,
        CASE 
            WHEN COALESCE(comp.total_accounts, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.total_accounts, 0)::DECIMAL - COALESCE(comp.total_accounts, 0)::DECIMAL) / comp.total_accounts) * 100
        END::DECIMAL as total_accounts_change_percent,
        (COALESCE(cd.telesales_profit_percentage, 0) - COALESCE(comp.telesales_profit_percentage, 0))::DECIMAL as telesales_percentage_change_percent
    FROM get_daily_rep_performance(current_start, current_end, department_filter, method_filter) cd
    FULL OUTER JOIN get_daily_rep_performance(comparison_start, comparison_end, department_filter, method_filter) comp 
        ON cd.rep_name = comp.rep_name
    WHERE COALESCE(cd.total_profit, 0) > 0 OR COALESCE(comp.total_profit, 0) > 0
    ORDER BY COALESCE(cd.total_profit, 0) DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_daily_rep_performance_comparison TO authenticated;
