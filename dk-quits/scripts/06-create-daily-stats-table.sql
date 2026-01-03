-- Daily aggregated statistics for faster analytics
CREATE TABLE IF NOT EXISTS daily_stats (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    stat_date DATE NOT NULL,
    cigarettes_smoked INT DEFAULT 0,
    urges_resisted INT DEFAULT 0,
    failed_urges INT DEFAULT 0,
    phase VARCHAR(20) NOT NULL,
    success_rate DECIMAL(5,2), -- Percentage of successful resistance
    longest_gap_hours INT, -- Longest time between cigarettes in hours
    first_cigarette_time TIME,
    last_cigarette_time TIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_daily_stats_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_daily_stats_phase CHECK (phase IN ('hourly', 'odd-even')),
    UNIQUE(user_id, stat_date)
);

-- Create indexes
CREATE INDEX idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date);
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, stat_date);
CREATE INDEX idx_daily_stats_phase ON daily_stats(phase);
