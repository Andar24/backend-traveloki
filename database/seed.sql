-- Insert categories
INSERT INTO categories (name, emoji, color) VALUES
    ('food', '🍜', '#FFA500'),
    ('fun', '🎉', '#FF1493'),
    ('hotels', '🏨', '#4169E1')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: AdminTraveloki123)
-- Hashed using bcrypt with salt rounds 10
INSERT INTO users (email, username, password_hash, full_name, role) VALUES
    ('admin@traveloki.com', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeZHlE.zC2u6pJwX5ZRMoS8G6Jy2rG.Fa', 'Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert test regular user (password: User12345)
INSERT INTO users (email, username, password_hash, full_name, role) VALUES
    ('user@traveloki.com', 'testuser', '$2a$10$N9qo8uLOickgx2ZMRZoMyeZHlE.zC2u6pJwX5ZRMoS8G6Jy2rG.Fa', 'Test User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert verified attractions (Medan)
INSERT INTO attractions (name, description, lat, lng, address, rating, is_verified, category_id) VALUES
    ('Mie Gacoan', 'Fast food noodle chain', 3.5674, 98.6459, 'Jl. Contoh No. 123', 4.2, TRUE, 1),
    ('Sate Madura Riyan', 'Best satay in town', 3.5541593, 98.6321586, 'Jl. Sate No. 45', 4.5, TRUE, 1),
    ('Ayam Penyet Jakarta', 'Try ayam penyet here', 3.5674444, 98.6501898, 'Jl. Ayam No. 67', 4.0, TRUE, 1),
    ('Lontong Qimra', 'Traditional lontong dish', 3.5674963, 98.6529323, 'Jl. Lontong No. 89', 4.3, TRUE, 1),
    ('Dimsum Naya', 'Dim sum restaurant', 3.5665051, 98.6614581, 'Jl. Dimsum No. 12', 4.1, TRUE, 1),
    ('Istana Maimun', 'Historic royal palace', 3.5752, 98.6848, 'Jl. Istana No. 1', 4.7, TRUE, 2),
    ('Plaza Medan Fair', 'Shopping mall with history', 3.5914508, 98.6634962, 'Jl. Mall No. 10', 4.2, TRUE, 2),
    ('Sun Plaza', 'The largest shopping center', 3.5836392, 98.6716045, 'Jl. Sun No. 20', 4.4, TRUE, 2),
    ('JW Marriott Hotel', 'Luxurious hotel', 3.59602, 98.67578, 'Jl. Marriott No. 5', 4.8, TRUE, 3),
    ('Odua Golden Mansyur', 'Hotel with great amenities', 3.5675709, 98.6560112, 'Jl. Golden No. 15', 4.1, TRUE, 3)
ON CONFLICT DO NOTHING;

-- Insert some pending user recommendations
INSERT INTO user_recommendations (name, description, lat, lng, address, category, status, submitted_by) VALUES
    ('Warung Nasi Padang Sederhana', 'Nasi padang enak dengan harga terjangkau', 3.5680, 98.6460, 'Jl. Padang No. 10', 'food', 'pending', (SELECT id FROM users WHERE email = 'user@traveloki.com')),
    ('Taman Kota Medan', 'Taman hijau untuk bersantai', 3.5800, 98.6700, 'Jl. Taman No. 5', 'fun', 'pending', (SELECT id FROM users WHERE email = 'user@traveloki.com'))
ON CONFLICT DO NOTHING;