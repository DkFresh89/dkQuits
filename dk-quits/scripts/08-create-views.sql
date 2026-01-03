-- Useful views for analytics and reporting

-- User progress summary view
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
    u.id AS user_id,
    u.name,
    u.email,
    us.current_phase,
    us.hourly_phase_start_date,
    IF(us.hourly_phase_start_date IS NOT NULL, DATEDIFF(CURRENT_DATE(), DATE(us.hourly_phase_start_date)), 0) AS days_in_current_phase,
    
    -- Today's stats
    IFNULL(ds_today.cigarettes_smoked, 0) AS cigarettes_today,
    IFNULL(ds_today.urges_resisted, 0) AS urges_resisted_today,
    IFNULL(ds_today.failed_urges, 0) AS failed_urges_today,
    
    -- All-time stats
    (SELECT COUNT(*) FROM smoking_sessions ss WHERE ss.user_id = u.id) AS total_cigarettes,
    (SELECT COUNT(*) FROM urges ur WHERE ur.user_id = u.id) AS total_urges_resisted,
    (SELECT COUNT(*) FROM failed_urges fu WHERE fu.user_id = u.id) AS total_failed_urges,
    
    -- Streaks and patterns
    (SELECT MAX(cigarettes_smoked) FROM daily_stats ds WHERE ds.user_id = u.id) AS max_cigarettes_per_day,
    (SELECT AVG(cigarettes_smoked) FROM daily_stats ds WHERE ds.user_id = u.id AND ds.stat_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) AS avg_cigarettes_last_7_days

FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
LEFT JOIN daily_stats ds_today ON u.id = ds_today.user_id AND ds_today.stat_date = CURRENT_DATE();

-- Weekly progress view
CREATE OR REPLACE VIEW weekly_progress AS
SELECT 
    user_id,
    DATE_SUB(stat_date, INTERVAL WEEKDAY(stat_date) DAY) AS week_start, -- Week starts on Monday
    SUM(cigarettes_smoked) AS weekly_cigarettes,
    SUM(urges_resisted) AS weekly_urges_resisted,
    SUM(failed_urges) AS weekly_failed_urges,
    AVG(success_rate) AS avg_success_rate,
    COUNT(*) AS days_tracked
FROM daily_stats
GROUP BY user_id, week_start
ORDER BY user_id, week_start;

-- Hourly patterns view (for identifying trigger times)
CREATE OR REPLACE VIEW hourly_patterns AS
SELECT 
    user_id,
    hour_of_day,
    SUM(CASE WHEN type = 'smoking_sessions' THEN 1 ELSE 0 END) AS cigarettes_count,
    SUM(CASE WHEN type = 'urges' THEN 1 ELSE 0 END) AS urges_count,
    SUM(CASE WHEN type = 'failed_urges' THEN 1 ELSE 0 END) AS failed_urges_count
FROM (
    SELECT user_id, hour_of_day, 'smoking_sessions' AS type FROM smoking_sessions
    UNION ALL
    SELECT user_id, hour_of_day, 'urges' AS type FROM urges
    UNION ALL
    SELECT user_id, hour_of_day, 'failed_urges' AS type FROM failed_urges
) AS combined
GROUP BY user_id, hour_of_day
ORDER BY user_id, hour_of_day;
