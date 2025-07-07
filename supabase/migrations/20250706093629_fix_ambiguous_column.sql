-- Fix ambiguous column reference in comparison function

DROP FUNCTION IF EXISTS get_daily_rep_performance_comparison(DATE, DATE, DATE, DATE, TEXT[], TEXT);

-- Fixed comparison function with proper table aliases
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
    WITH current_period AS (
        SELECT 
            CASE 
                WHEN d."Department" IN ('REVA', 'Wholesale', 'WHOLESALE') AND d."Sub-Rep" IS NOT NULL AND d."Sub-Rep" != ''
                THEN d."Sub-Rep"
                ELSE d."Rep"
            END as rep_name,
            COALESCE(SUM(d."Spend"), 0) as spend,
            COALESCE(SUM(d."Profit"), 0) as profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE 0 END), 0) as margin,
            COUNT(DISTINCT d."Account Ref") as accounts,
            COALESCE(SUM(CASE WHEN d."Method" = 'telesales' THEN d."Profit" ELSE 0 END), 0) as telesales_profit,
            COALESCE((SUM(CASE WHEN d."Method" = 'telesales' THEN d."Profit" ELSE 0 END) / NULLIF(SUM(d."Profit"), 0)) * 100, 0) as telesales_percentage
        FROM "Daily_Data" d
        WHERE d."Date_Time"::DATE BETWEEN current_start AND current_end
            AND d."Account Ref" IS NOT NULL
            AND (department_filter IS NULL OR 
                 (array_length(department_filter, 1) > 0 AND d."Department" = ANY(department_filter)))
            AND (method_filter IS NULL OR d."Method" = method_filter)
        GROUP BY 
            CASE 
                WHEN d."Department" IN ('REVA', 'Wholesale', 'WHOLESALE') AND d."Sub-Rep" IS NOT NULL AND d."Sub-Rep" != ''
                THEN d."Sub-Rep"
                ELSE d."Rep"
            END
    ),
    comparison_period AS (
        SELECT 
            CASE 
                WHEN d."Department" IN ('REVA', 'Wholesale', 'WHOLESALE') AND d."Sub-Rep" IS NOT NULL AND d."Sub-Rep" != ''
                THEN d."Sub-Rep"
                ELSE d."Rep"
            END as rep_name,
            COALESCE(SUM(d."Spend"), 0) as spend,
            COALESCE(SUM(d."Profit"), 0) as profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE 0 END), 0) as margin,
            COUNT(DISTINCT d."Account Ref") as accounts,
            COALESCE(SUM(CASE WHEN d."Method" = 'telesales' THEN d."Profit" ELSE 0 END), 0) as telesales_profit,
            COALESCE((SUM(CASE WHEN d."Method" = 'telesales' THEN d."Profit" ELSE 0 END) / NULLIF(SUM(d."Profit"), 0)) * 100, 0) as telesales_percentage
        FROM "Daily_Data" d
        WHERE d."Date_Time"::DATE BETWEEN comparison_start AND comparison_end
            AND d."Account Ref" IS NOT NULL
            AND (department_filter IS NULL OR 
                 (array_length(department_filter, 1) > 0 AND d."Department" = ANY(department_filter)))
            AND (method_filter IS NULL OR d."Method" = method_filter)
        GROUP BY 
            CASE 
                WHEN d."Department" IN ('REVA', 'Wholesale', 'WHOLESALE') AND d."Sub-Rep" IS NOT NULL AND d."Sub-Rep" != ''
                THEN d."Sub-Rep"
                ELSE d."Rep"
            END
    ),
    all_reps AS (
        SELECT DISTINCT rep_name FROM (
            SELECT cp.rep_name FROM current_period cp
            UNION
            SELECT comp.rep_name FROM comparison_period comp
        ) combined
    )
    SELECT 
        ar.rep_name,
        COALESCE(cp.spend, 0)::DECIMAL as current_spend,
        COALESCE(cp.profit, 0)::DECIMAL as current_profit,
        COALESCE(cp.margin, 0)::DECIMAL as current_margin,
        COALESCE(cp.accounts, 0)::INTEGER as current_active_accounts,
        COALESCE(cp.accounts, 0)::INTEGER as current_total_accounts,
        COALESCE(cp.telesales_profit, 0)::DECIMAL as current_telesales_profit,
        COALESCE(cp.telesales_percentage, 0)::DECIMAL as current_telesales_percentage,
        COALESCE(comp.spend, 0)::DECIMAL as comparison_spend,
        COALESCE(comp.profit, 0)::DECIMAL as comparison_profit,
        COALESCE(comp.margin, 0)::DECIMAL as comparison_margin,
        COALESCE(comp.accounts, 0)::INTEGER as comparison_active_accounts,
        COALESCE(comp.accounts, 0)::INTEGER as comparison_total_accounts,
        COALESCE(comp.telesales_profit, 0)::DECIMAL as comparison_telesales_profit,
        COALESCE(comp.telesales_percentage, 0)::DECIMAL as comparison_telesales_percentage,
        -- Changes
        CASE 
            WHEN COALESCE(comp.spend, 0) = 0 THEN 0
            ELSE ((COALESCE(cp.spend, 0) - COALESCE(comp.spend, 0)) / comp.spend) * 100
        END::DECIMAL as spend_change_percent,
        CASE 
            WHEN COALESCE(comp.profit, 0) = 0 THEN 0
            ELSE ((COALESCE(cp.profit, 0) - COALESCE(comp.profit, 0)) / comp.profit) * 100
        END::DECIMAL as profit_change_percent,
        (COALESCE(cp.margin, 0) - COALESCE(comp.margin, 0))::DECIMAL as margin_change_percent,
        CASE 
            WHEN COALESCE(comp.accounts, 0) = 0 THEN 0
            ELSE ((COALESCE(cp.accounts, 0)::DECIMAL - COALESCE(comp.accounts, 0)::DECIMAL) / comp.accounts) * 100
        END::DECIMAL as active_accounts_change_percent,
        CASE 
            WHEN COALESCE(comp.accounts, 0) = 0 THEN 0
            ELSE ((COALESCE(cp.accounts, 0)::DECIMAL - COALESCE(comp.accounts, 0)::DECIMAL) / comp.accounts) * 100
        END::DECIMAL as total_accounts_change_percent,
        (COALESCE(cp.telesales_percentage, 0) - COALESCE(comp.telesales_percentage, 0))::DECIMAL as telesales_percentage_change_percent
    FROM all_reps ar
    LEFT JOIN current_period cp ON ar.rep_name = cp.rep_name
    LEFT JOIN comparison_period comp ON ar.rep_name = comp.rep_name
    WHERE COALESCE(cp.profit, 0) > 0 OR COALESCE(comp.profit, 0) > 0
    ORDER BY COALESCE(cp.profit, 0) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_daily_rep_performance_comparison TO authenticated;
