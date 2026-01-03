-- Urges/cravings that were successfully resisted
CREATE TABLE IF NOT EXISTS urges (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  timestamp DATETIME NOT NULL,
  motivational_message TEXT NOT NULL,
  urge_date DATE NOT NULL,
  hour_of_day INT NOT NULL,
  day_of_week INT NOT NULL, -- 0 = Monday, 6 = Sunday
  intensity INT CHECK (intensity >= 1 AND intensity <= 10), -- Future feature
  trigger_type VARCHAR(50), -- Future feature: 'stress', 'social', 'habit', 'boredom', etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_urges_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_urge_hour_of_day CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  CONSTRAINT chk_urge_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

-- Create indexes for analytics
CREATE INDEX idx_urges_user_id ON urges(user_id);
CREATE INDEX idx_urges_timestamp ON urges(timestamp);
CREATE INDEX idx_urges_date ON urges(urge_date);
CREATE INDEX idx_urges_user_date ON urges(user_id, urge_date);
CREATE INDEX idx_urges_hour ON urges(hour_of_day);
CREATE INDEX idx_urges_dow ON urges(day_of_week);
CREATE INDEX idx_urges_trigger ON urges(trigger_type);
