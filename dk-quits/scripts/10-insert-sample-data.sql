-- Sample data for testing (optional)
-- This would be removed in production

-- Insert a test user
INSERT INTO users (id, email, name, password_hash, email_verified) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'test@example.com',
    'Test User',
    '$2b$10$example_hash_here', -- This would be a real bcrypt hash
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert user settings
INSERT INTO user_settings (user_id, current_phase, hourly_phase_start_date, cigarettes_per_pack)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'hourly',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    20
) ON CONFLICT (user_id) DO NOTHING;

-- Insert some sample smoking sessions
INSERT INTO smoking_sessions (user_id, timestamp, cigarette_number, phase)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP - INTERVAL '4 hours', 1, 'hourly'),
    ('550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP - INTERVAL '3 hours', 2, 'hourly'),
    ('550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP - INTERVAL '2 hours', 3, 'hourly');

-- Insert some sample urges
INSERT INTO urges (user_id, timestamp, motivational_message)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'You''re stronger than this craving! 💪'),
    ('550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'Every urge you resist makes you stronger! 🌟');
