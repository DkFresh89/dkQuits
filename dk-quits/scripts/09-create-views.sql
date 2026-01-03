-- Useful views for analytics and reporting

-- User progress summary view
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    us.current_phase,
    us.hourly_phase_start_date,
    CASE 
        WHEN us.hourly_phase_start_date IS NOT NULL 
        THEN CURRENT_DATE - us.hourly_phase_start_date::date 
        ELSE 0 
    END as days_in_current_phase,
    
    -- Today's stats
    COALESCE(ds_today.cigarettes_smoked, 0) as cigarettes_today,
    COALESCE(ds_today.urges_resisted, 0) as urges_resisted_today,
    COALESCE(ds_today.failed_urges, 0) as failed_urges_today,
    
    -- All-time stats
    (SELECT COUNT(*) FROM smoking_sessions ss WHERE ss.user_id = u.id) as total_cigarettes,
    (SELECT COUNT(*) FROM urges ur WHERE ur.user_id = u.id) as total_urges_resisted,
    (SELECT COUNT(*) FROM failed_urges fu WHERE fu.user_id = u.id) as total_failed_urges,
    
    -- Streaks and patterns
    (SELECT MAX(cigarettes_smoked) FROM daily_stats ds WHERE ds.user_id = u.id) as max_cigarettes_per_day,
    (SELECT AVG(cigarettes_smoked) FROM daily_stats ds WHERE ds.user_id = u.id AND ds.stat_date >= CURRENT_DATE - INTERVAL '7 days') as avg_cigarettes_last_7_days

FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
LEFT JOIN daily_stats ds_today ON u.id = ds_today.user_id AND ds_today.stat_date = CURRENT_DATE;

-- Weekly progress view
CREATE OR REPLACE VIEW weekly_progress AS
SELECT 
    user_id,
    DATE_TRUNC('week', stat_date) as week_start,
    SUM(cigarettes_smoked) as weekly_cigarettes,
    SUM(urges_resisted) as weekly_urges_resisted,
    SUM(failed_urges) as weekly_failed_urges,
    AVG(success_rate) as avg_success_rate,
    COUNT(*) as days_tracked
FROM daily_stats
GROUP BY user_id, DATE_TRUNC('week', stat_date)
ORDER BY user_id, week_start;

-- Hourly patterns view (for identifying trigger times)
CREATE OR REPLACE VIEW hourly_patterns AS
SELECT 
    user_id,
    hour_of_day,
    COUNT(*) FILTER (WHERE 'smoking_sessions') as cigarettes_count,
    COUNT(*) FILTER (WHERE 'urges') as urges_count,
    COUNT(*) FILTER (WHERE 'failed_urges') as failed_urges_count
FROM (
    SELECT user_id, hour_of_day, 'smoking_sessions' as type FROM smoking_sessions
    UNION ALL
    SELECT user_id, hour_of_day, 'urges' as type FROM urges
    UNION ALL
    SELECT user_id, hour_of_day, 'failed_urges' as type FROM failed_urges
) combined
GROUP BY user_id, hour_of_day
ORDER BY user_id, hour_of_day;
