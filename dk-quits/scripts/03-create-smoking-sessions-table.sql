-- Smoking sessions (successful cigarettes logged within allowed windows)
CREATE TABLE IF NOT EXISTS smoking_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  timestamp DATETIME NOT NULL,
  cigarette_number INT NOT NULL,
  phase VARCHAR(20) NOT NULL,
  session_date DATE NOT NULL,
  hour_of_day INT NOT NULL,
  day_of_week INT NOT NULL, -- 0 = Monday, 6 = Sunday (WEEKDAY() returns 0 for Monday)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_smoking_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_smoking_phase CHECK (phase IN ('hourly', 'odd-even')),
  CONSTRAINT chk_smoking_hour_of_day CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  CONSTRAINT chk_smoking_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Ensure no duplicate cigarettes per day for a user
  UNIQUE(user_id, session_date, cigarette_number)
);

-- Create indexes for analytics and performance
CREATE INDEX idx_smoking_sessions_user_id ON smoking_sessions(user_id);
CREATE INDEX idx_smoking_sessions_timestamp ON smoking_sessions(timestamp);
CREATE INDEX idx_smoking_sessions_date ON smoking_sessions(session_date);
CREATE INDEX idx_smoking_sessions_user_date ON smoking_sessions(user_id, session_date);
CREATE INDEX idx_smoking_sessions_phase ON smoking_sessions(phase);
CREATE INDEX idx_smoking_sessions_hour ON smoking_sessions(hour_of_day);
CREATE INDEX idx_smoking_sessions_dow ON smoking_sessions(day_of_week);
