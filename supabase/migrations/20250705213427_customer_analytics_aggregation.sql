-- Customer Analytics Aggregation Functions
-- Provides efficient server-side aggregation for customer-focused analytics

-- Function to get customer performance aggregated by time periods
CREATE OR REPLACE FUNCTION get_customer_performance_aggregated(
    start_date DATE,
    end_date DATE,
    department_filter TEXT DEFAULT NULL,
    method_filter TEXT DEFAULT NULL,
    rep_filter TEXT DEFAULT NULL,
    limit_customers INTEGER DEFAULT 50
)
RETURNS TABLE (
    account_ref TEXT,
    account_name TEXT,
    total_spend DECIMAL,
    total_cost DECIMAL,
    total_credit DECIMAL,
    total_profit DECIMAL,
    avg_margin DECIMAL,
    total_packs INTEGER,
    transaction_count INTEGER,
    first_transaction_date DATE,
    last_transaction_date DATE,
    days_active INTEGER,
    avg_spend_per_transaction DECIMAL,
    avg_profit_per_transaction DECIMAL,
    department_breakdown JSONB,
    method_breakdown JSONB,
    rep_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d."Account Ref" AS account_ref,
        d."Account Name" AS account_name,
        COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
        COALESCE(SUM(d."Cost"), 0)::DECIMAL AS total_cost,
        COALESCE(SUM(d."Credit"), 0)::DECIMAL AS total_credit,
        COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
        CASE 
            WHEN SUM(d."Spend") > 0 THEN 
                COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE NULL END), 0)::DECIMAL
            ELSE 0::DECIMAL
        END AS avg_margin,
        COALESCE(SUM(d."Packs"), 0)::INTEGER AS total_packs,
        COUNT(*)::INTEGER AS transaction_count,
        MIN(d."Date_Time"::DATE) AS first_transaction_date,
        MAX(d."Date_Time"::DATE) AS last_transaction_date,
        (MAX(d."Date_Time"::DATE) - MIN(d."Date_Time"::DATE))::INTEGER AS days_active,
        CASE 
            WHEN COUNT(*) > 0 THEN (COALESCE(SUM(d."Spend"), 0) / COUNT(*))::DECIMAL
            ELSE 0::DECIMAL
        END AS avg_spend_per_transaction,
        CASE 
            WHEN COUNT(*) > 0 THEN (COALESCE(SUM(d."Profit"), 0) / COUNT(*))::DECIMAL
            ELSE 0::DECIMAL
        END AS avg_profit_per_transaction,
        -- Department breakdown as JSON
        jsonb_object_agg(
            COALESCE(d."Department", 'Unknown'), 
            jsonb_build_object(
                'spend', COALESCE(SUM(d."Spend"), 0),
                'profit', COALESCE(SUM(d."Profit"), 0),
                'transactions', COUNT(*)
            )
        ) FILTER (WHERE d."Department" IS NOT NULL) AS department_breakdown,
        -- Method breakdown as JSON
        jsonb_object_agg(
            COALESCE(d."Method", 'Unknown'), 
            jsonb_build_object(
                'spend', COALESCE(SUM(d."Spend"), 0),
                'profit', COALESCE(SUM(d."Profit"), 0),
                'transactions', COUNT(*)
            )
        ) FILTER (WHERE d."Method" IS NOT NULL) AS method_breakdown,
        -- Rep info as JSON
        jsonb_build_object(
            'primary_rep', d."Rep",
            'sub_rep', d."Sub-Rep"
        ) AS rep_info
    FROM "Daily_Data" d
    WHERE d."Date_Time"::DATE BETWEEN start_date AND end_date
        AND (department_filter IS NULL OR d."Department" = department_filter)
        AND (method_filter IS NULL OR d."Method" = method_filter)
        AND (rep_filter IS NULL OR d."Rep" = rep_filter OR d."Sub-Rep" = rep_filter)
        AND d."Account Ref" IS NOT NULL
        AND d."Account Name" IS NOT NULL
    GROUP BY d."Account Ref", d."Account Name", d."Rep", d."Sub-Rep"
    ORDER BY total_profit DESC
    LIMIT limit_customers;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer trends over time (monthly/weekly aggregation)
CREATE OR REPLACE FUNCTION get_customer_trends_aggregated(
    customer_account_ref TEXT,
    start_date DATE,
    end_date DATE,
    aggregation_period TEXT DEFAULT 'monthly' -- 'weekly', 'monthly', 'daily'
)
RETURNS TABLE (
    period_start DATE,
    period_end DATE,
    period_label TEXT,
    total_spend DECIMAL,
    total_profit DECIMAL,
    avg_margin DECIMAL,
    total_packs INTEGER,
    transaction_count INTEGER,
    avg_spend_per_transaction DECIMAL
) AS $$
BEGIN
    IF aggregation_period = 'weekly' THEN
        RETURN QUERY
        SELECT 
            date_trunc('week', d."Date_Time")::DATE AS period_start,
            (date_trunc('week', d."Date_Time") + INTERVAL '6 days')::DATE AS period_end,
            'Week ' || to_char(date_trunc('week', d."Date_Time"), 'WW-YYYY') AS period_label,
            COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE NULL END), 0)::DECIMAL AS avg_margin,
            COALESCE(SUM(d."Packs"), 0)::INTEGER AS total_packs,
            COUNT(*)::INTEGER AS transaction_count,
            CASE 
                WHEN COUNT(*) > 0 THEN (COALESCE(SUM(d."Spend"), 0) / COUNT(*))::DECIMAL
                ELSE 0::DECIMAL
            END AS avg_spend_per_transaction
        FROM "Daily_Data" d
        WHERE d."Account Ref" = customer_account_ref
            AND d."Date_Time"::DATE BETWEEN start_date AND end_date
        GROUP BY date_trunc('week', d."Date_Time")
        ORDER BY period_start;
        
    ELSIF aggregation_period = 'daily' THEN
        RETURN QUERY
        SELECT 
            d."Date_Time"::DATE AS period_start,
            d."Date_Time"::DATE AS period_end,
            to_char(d."Date_Time", 'DD/MM/YYYY') AS period_label,
            COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE NULL END), 0)::DECIMAL AS avg_margin,
            COALESCE(SUM(d."Packs"), 0)::INTEGER AS total_packs,
            COUNT(*)::INTEGER AS transaction_count,
            CASE 
                WHEN COUNT(*) > 0 THEN (COALESCE(SUM(d."Spend"), 0) / COUNT(*))::DECIMAL
                ELSE 0::DECIMAL
            END AS avg_spend_per_transaction
        FROM "Daily_Data" d
        WHERE d."Account Ref" = customer_account_ref
            AND d."Date_Time"::DATE BETWEEN start_date AND end_date
        GROUP BY d."Date_Time"::DATE
        ORDER BY period_start;
        
    ELSE -- Default to monthly
        RETURN QUERY
        SELECT 
            date_trunc('month', d."Date_Time")::DATE AS period_start,
            (date_trunc('month', d."Date_Time") + INTERVAL '1 month' - INTERVAL '1 day')::DATE AS period_end,
            to_char(date_trunc('month', d."Date_Time"), 'Mon YYYY') AS period_label,
            COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
            COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
            COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE NULL END), 0)::DECIMAL AS avg_margin,
            COALESCE(SUM(d."Packs"), 0)::INTEGER AS total_packs,
            COUNT(*)::INTEGER AS transaction_count,
            CASE 
                WHEN COUNT(*) > 0 THEN (COALESCE(SUM(d."Spend"), 0) / COUNT(*))::DECIMAL
                ELSE 0::DECIMAL
            END AS avg_spend_per_transaction
        FROM "Daily_Data" d
        WHERE d."Account Ref" = customer_account_ref
            AND d."Date_Time"::DATE BETWEEN start_date AND end_date
        GROUP BY date_trunc('month', d."Date_Time")
        ORDER BY period_start;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get top/bottom customers by various metrics
CREATE OR REPLACE FUNCTION get_customer_rankings(
    start_date DATE,
    end_date DATE,
    rank_by TEXT DEFAULT 'profit', -- 'profit', 'spend', 'margin', 'transactions', 'packs'
    department_filter TEXT DEFAULT NULL,
    method_filter TEXT DEFAULT NULL,
    rep_filter TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 20,
    bottom_performers BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    ranking INTEGER,
    account_ref TEXT,
    account_name TEXT,
    primary_metric DECIMAL,
    total_spend DECIMAL,
    total_profit DECIMAL,
    avg_margin DECIMAL,
    total_packs INTEGER,
    transaction_count INTEGER,
    days_active INTEGER,
    primary_department TEXT,
    primary_method TEXT,
    primary_rep TEXT
) AS $$
DECLARE
    order_direction TEXT;
    rank_field TEXT;
BEGIN
    -- Set ordering direction
    order_direction := CASE WHEN bottom_performers THEN 'ASC' ELSE 'DESC' END;
    
    -- Set ranking field
    rank_field := CASE 
        WHEN rank_by = 'spend' THEN 'total_spend'
        WHEN rank_by = 'margin' THEN 'avg_margin'
        WHEN rank_by = 'transactions' THEN 'transaction_count'
        WHEN rank_by = 'packs' THEN 'total_packs'
        ELSE 'total_profit'
    END;
    
    RETURN QUERY
    EXECUTE format('
        SELECT 
            ROW_NUMBER() OVER (ORDER BY %I %s)::INTEGER AS ranking,
            subq.account_ref,
            subq.account_name,
            subq.%I AS primary_metric,
            subq.total_spend,
            subq.total_profit,
            subq.avg_margin,
            subq.total_packs,
            subq.transaction_count,
            subq.days_active,
            subq.primary_department,
            subq.primary_method,
            subq.primary_rep
        FROM (
            SELECT 
                d."Account Ref" AS account_ref,
                d."Account Name" AS account_name,
                COALESCE(SUM(d."Spend"), 0)::DECIMAL AS total_spend,
                COALESCE(SUM(d."Profit"), 0)::DECIMAL AS total_profit,
                CASE 
                    WHEN SUM(d."Spend") > 0 THEN 
                        COALESCE(AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE NULL END), 0)::DECIMAL
                    ELSE 0::DECIMAL
                END AS avg_margin,
                COALESCE(SUM(d."Packs"), 0)::INTEGER AS total_packs,
                COUNT(*)::INTEGER AS transaction_count,
                (MAX(d."Date_Time"::DATE) - MIN(d."Date_Time"::DATE))::INTEGER AS days_active,
                MODE() WITHIN GROUP (ORDER BY d."Department") AS primary_department,
                MODE() WITHIN GROUP (ORDER BY d."Method") AS primary_method,
                MODE() WITHIN GROUP (ORDER BY d."Rep") AS primary_rep
            FROM "Daily_Data" d
            WHERE d."Date_Time"::DATE BETWEEN $1 AND $2
                AND ($3 IS NULL OR d."Department" = $3)
                AND ($4 IS NULL OR d."Method" = $4)
                AND ($5 IS NULL OR d."Rep" = $5 OR d."Sub-Rep" = $5)
                AND d."Account Ref" IS NOT NULL
                AND d."Account Name" IS NOT NULL
            GROUP BY d."Account Ref", d."Account Name"
            HAVING COUNT(*) > 0
        ) subq
        ORDER BY %I %s
        LIMIT $6',
        rank_field, order_direction, rank_field, rank_field, order_direction
    )
    USING start_date, end_date, department_filter, method_filter, rep_filter, limit_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer loyalty/frequency analysis
CREATE OR REPLACE FUNCTION get_customer_loyalty_analysis(
    start_date DATE,
    end_date DATE,
    department_filter TEXT DEFAULT NULL,
    method_filter TEXT DEFAULT NULL,
    rep_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    loyalty_tier TEXT,
    customer_count INTEGER,
    avg_spend_per_customer DECIMAL,
    avg_profit_per_customer DECIMAL,
    avg_margin DECIMAL,
    total_spend_contribution DECIMAL,
    total_profit_contribution DECIMAL,
    avg_transactions_per_customer DECIMAL,
    avg_days_between_transactions DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH customer_stats AS (
        SELECT 
            d."Account Ref" AS account_ref,
            d."Account Name" AS account_name,
            COUNT(*) AS transaction_count,
            SUM(d."Spend") AS total_spend,
            SUM(d."Profit") AS total_profit,
            AVG(CASE WHEN d."Spend" > 0 THEN (d."Profit" / d."Spend") * 100 ELSE NULL END) AS avg_margin,
            MAX(d."Date_Time"::DATE) - MIN(d."Date_Time"::DATE) AS days_span,
            CASE 
                WHEN COUNT(*) > 1 THEN (MAX(d."Date_Time"::DATE) - MIN(d."Date_Time"::DATE))::DECIMAL / (COUNT(*) - 1)
                ELSE NULL
            END AS avg_days_between_transactions
        FROM "Daily_Data" d
        WHERE d."Date_Time"::DATE BETWEEN start_date AND end_date
            AND (department_filter IS NULL OR d."Department" = department_filter)
            AND (method_filter IS NULL OR d."Method" = method_filter)
            AND (rep_filter IS NULL OR d."Rep" = rep_filter OR d."Sub-Rep" = rep_filter)
            AND d."Account Ref" IS NOT NULL
            AND d."Account Name" IS NOT NULL
        GROUP BY d."Account Ref", d."Account Name"
    ),
    loyalty_tiers AS (
        SELECT 
            *,
            CASE 
                WHEN transaction_count >= 20 THEN 'VIP (20+ transactions)'
                WHEN transaction_count >= 10 THEN 'Loyal (10-19 transactions)'
                WHEN transaction_count >= 5 THEN 'Regular (5-9 transactions)'
                WHEN transaction_count >= 2 THEN 'Occasional (2-4 transactions)'
                ELSE 'New (1 transaction)'
            END AS loyalty_tier
        FROM customer_stats
    ),
    total_metrics AS (
        SELECT 
            SUM(total_spend) AS grand_total_spend,
            SUM(total_profit) AS grand_total_profit
        FROM loyalty_tiers
    )
    SELECT 
        lt.loyalty_tier,
        COUNT(*)::INTEGER AS customer_count,
        AVG(lt.total_spend)::DECIMAL AS avg_spend_per_customer,
        AVG(lt.total_profit)::DECIMAL AS avg_profit_per_customer,
        AVG(lt.avg_margin)::DECIMAL AS avg_margin,
        (SUM(lt.total_spend) / tm.grand_total_spend * 100)::DECIMAL AS total_spend_contribution,
        (SUM(lt.total_profit) / tm.grand_total_profit * 100)::DECIMAL AS total_profit_contribution,
        AVG(lt.transaction_count)::DECIMAL AS avg_transactions_per_customer,
        AVG(lt.avg_days_between_transactions)::DECIMAL AS avg_days_between_transactions
    FROM loyalty_tiers lt
    CROSS JOIN total_metrics tm
    GROUP BY lt.loyalty_tier, tm.grand_total_spend, tm.grand_total_profit
    ORDER BY 
        CASE lt.loyalty_tier
            WHEN 'VIP (20+ transactions)' THEN 1
            WHEN 'Loyal (10-19 transactions)' THEN 2
            WHEN 'Regular (5-9 transactions)' THEN 3
            WHEN 'Occasional (2-4 transactions)' THEN 4
            WHEN 'New (1 transaction)' THEN 5
        END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_customer_performance_aggregated TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_trends_aggregated TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_rankings TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_loyalty_analysis TO authenticated;
