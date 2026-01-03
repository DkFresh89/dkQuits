-- User settings and preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    current_phase VARCHAR(20) DEFAULT 'hourly',
    hourly_phase_start_date DATETIME,
    cigarettes_per_pack INT DEFAULT 20,
    target_quit_date DATE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    daily_reminder_time TIME DEFAULT '09:00:00',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_current_phase CHECK (current_phase IN ('hourly', 'odd-even')),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_phase ON user_settings(current_phase);
