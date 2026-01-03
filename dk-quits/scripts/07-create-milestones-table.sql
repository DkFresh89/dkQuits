-- Track user milestones and achievements
CREATE TABLE IF NOT EXISTS milestones (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    milestone_type VARCHAR(50) NOT NULL, -- 'first_day', 'first_week', 'phase_advance', 'streak_7', etc.
    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,
    achieved_at DATETIME NOT NULL,
    phase_when_achieved VARCHAR(20) NOT NULL,
    days_since_start INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_milestones_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_milestone_phase CHECK (phase_when_achieved IN ('hourly', 'odd-even')),
    UNIQUE(user_id, milestone_type)
);

-- Create indexes
CREATE INDEX idx_milestones_user_id ON milestones(user_id);
CREATE INDEX idx_milestones_type ON milestones(milestone_type);
CREATE INDEX idx_milestones_achieved ON milestones(achieved_at);
