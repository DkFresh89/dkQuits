-- Sample data for testing (optional)
-- This would be removed in production

-- Insert a test user
INSERT IGNORE INTO users (id, email, name, password_hash, email_verified) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'test@example.com',
    'Test User',
    '$2b$10$example_hash_here', -- This would be a real bcrypt hash
    TRUE
);

-- Insert user settings
INSERT IGNORE INTO user_settings (user_id, current_phase, hourly_phase_start_date, cigarettes_per_pack)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'hourly',
    DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 DAY),
    20
);

-- Insert some sample smoking sessions
INSERT INTO smoking_sessions (user_id, timestamp, cigarette_number, phase)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 4 HOUR), 1, 'hourly'),
    ('550e8400-e29b-41d4-a716-446655440000', DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 3 HOUR), 2, 'hourly'),
    ('550e8400-e29b-41d4-a716-446655440000', DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 2 HOUR), 3, 'hourly');

-- Insert some sample urges
INSERT INTO urges (user_id, timestamp, motivational_message)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR), 'You''re stronger than this craving! 💪'),
    ('550e8400-e29b-41d4-a716-446655440000', DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE), 'Every urge you resist makes you stronger! 🌟');
