-- Failed urges (cigarettes smoked outside allowed windows)
CREATE TABLE IF NOT EXISTS failed_urges (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  timestamp DATETIME NOT NULL,
  cigarette_number INT NOT NULL,
  phase VARCHAR(20) NOT NULL,
  session_date DATE NOT NULL,
  hour_of_day INT NOT NULL,
  day_of_week INT NOT NULL, -- 0 = Monday, 6 = Sunday
  time_since_last_allowed_seconds INT, -- Stored in seconds
  trigger_type VARCHAR(50), -- What caused the slip: 'stress', 'social', 'habit', etc.
  recovery_message TEXT, -- The motivational message shown after logging
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_failed_urges_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_failed_phase CHECK (phase IN ('hourly', 'odd-even')),
  CONSTRAINT chk_failed_hour_of_day CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  CONSTRAINT chk_failed_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

-- Create indexes
CREATE INDEX idx_failed_urges_user_id ON failed_urges(user_id);
CREATE INDEX idx_failed_urges_timestamp ON failed_urges(timestamp);
CREATE INDEX idx_failed_urges_date ON failed_urges(session_date);
CREATE INDEX idx_failed_urges_user_date ON failed_urges(user_id, session_date);
CREATE INDEX idx_failed_urges_phase ON failed_urges(phase);
CREATE INDEX idx_failed_urges_trigger ON failed_urges(trigger_type);
