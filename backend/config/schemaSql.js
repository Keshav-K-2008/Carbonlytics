export const schemaSql = `-- Carbonlytix Database Schema
-- Compatible with Supabase PostgreSQL and standard PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables (for development migrations)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS bookmarked_resources CASCADE;
DROP TABLE IF EXISTS educational_resources CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS sustainability_goals CASCADE;
DROP TABLE IF EXISTS carbon_activities CASCADE;
DROP TABLE IF EXISTS emission_factors CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table (Core authentication reference)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles Table (User settings, points, levels, stats)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    subscription_status VARCHAR(50) DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
    current_level VARCHAR(50) DEFAULT 'Beginner' NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    highest_streak INTEGER DEFAULT 0 NOT NULL,
    last_activity_date DATE,
    daily_emission_target NUMERIC(10,2) DEFAULT 15.00, -- kg CO2e
    monthly_emission_target NUMERIC(10,2) DEFAULT 450.00, -- kg CO2e
    preferences JSONB DEFAULT '{"notifications": true, "theme": "dark", "interests": []}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Emission Factors Table
CREATE TABLE emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    factor NUMERIC(10,4) NOT NULL, -- kg CO2e per unit
    unit VARCHAR(50) NOT NULL, -- e.g., km, kWh, kg, liters
    source VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_subcategory UNIQUE (category, subcategory)
);

-- 4. Carbon Activities Table
CREATE TABLE carbon_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('transportation', 'electricity', 'food', 'waste', 'water')),
    subcategory VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    emission_factor NUMERIC(10,4) NOT NULL,
    calculated_emissions NUMERIC(10,2) NOT NULL, -- kg CO2e
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Sustainability Goals Table
CREATE TABLE sustainability_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('monthly', 'quarterly', 'yearly')),
    category VARCHAR(100) NOT NULL CHECK (category IN ('overall', 'transportation', 'electricity', 'food', 'waste', 'water')),
    target_reduction_pct NUMERIC(5,2) NOT NULL CHECK (target_reduction_pct > 0 AND target_reduction_pct <= 100),
    target_emission NUMERIC(10,2) NOT NULL, -- target limit in kg CO2e
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'achieved', 'failed')),
    progress_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Achievements Table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    criteria_type VARCHAR(100) NOT NULL CHECK (criteria_type IN ('emissions_reduced', 'challenges_completed', 'streak_days', 'points_earned')),
    criteria_value INTEGER NOT NULL,
    icon VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Achievements mapping
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- 8. Badges Table
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. User Badges mapping
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- 10. Challenges Table
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    points_reward INTEGER NOT NULL DEFAULT 100,
    badge_reward_id UUID REFERENCES badges(id) ON DELETE SET NULL,
    icon VARCHAR(100) DEFAULT 'Trophy',
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Challenge Participants Table
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'enrolled' NOT NULL CHECK (status IN ('enrolled', 'completed', 'failed')),
    progress NUMERIC(5,2) DEFAULT 0.00 NOT NULL, -- 0 to 100%
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_user_challenge_enrollment UNIQUE (challenge_id, user_id)
);

-- 12. Educational Resources Table
CREATE TABLE educational_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., energy, transport, recycling, water, general
    author VARCHAR(100) DEFAULT 'Carbonlytix Editorial',
    read_time_mins INTEGER DEFAULT 3 NOT NULL,
    read_count INTEGER DEFAULT 0 NOT NULL,
    bookmark_count INTEGER DEFAULT 0 NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Bookmarked Resources mapping
CREATE TABLE bookmarked_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_bookmark UNIQUE (user_id, resource_id)
);

-- 14. Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('monthly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_emissions NUMERIC(10,2) NOT NULL,
    score INTEGER NOT NULL,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (type IN ('reminder', 'challenge', 'achievement', 'recommendation', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Database Indexes for optimized querying
CREATE INDEX idx_profiles_points ON profiles(total_points DESC);
CREATE INDEX idx_activities_user_date ON carbon_activities(user_id, activity_date);
CREATE INDEX idx_goals_user_status ON sustainability_goals(user_id, status);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Trigger to auto-update updated_at on records
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_emission_factors_modtime BEFORE UPDATE ON emission_factors FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_carbon_activities_modtime BEFORE UPDATE ON carbon_activities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_sustainability_goals_modtime BEFORE UPDATE ON sustainability_goals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_educational_resources_modtime BEFORE UPDATE ON educational_resources FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ROW LEVEL SECURITY (RLS) policies for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarked_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Simple policies (Only the user can read/write their own data)
CREATE POLICY user_self_read ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_self_update ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY profile_self_read ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profile_self_update ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY activities_self_all ON carbon_activities FOR ALL USING (auth.uid() = user_id);

CREATE POLICY goals_self_all ON sustainability_goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY participants_self_all ON challenge_participants FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_achievements_self_read ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_badges_self_read ON user_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY bookmarks_self_all ON bookmarked_resources FOR ALL USING (auth.uid() = user_id);

CREATE POLICY reports_self_all ON reports FOR ALL USING (auth.uid() = user_id);

CREATE POLICY notifications_self_all ON notifications FOR ALL USING (auth.uid() = user_id);

-- Automatically create users and profiles from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, role)
  VALUES (new.id, new.email, '', 'user');

  INSERT INTO public.profiles (id, full_name, total_points, current_streak, highest_streak, current_level)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Eco User'), 0, 0, 0, 'Beginner');

  INSERT INTO public.notifications (id, user_id, title, message, type)
  VALUES (
    gen_random_uuid(),
    new.id,
    'Welcome to Carbonlytix!',
    'Start tracking and reducing your carbon footprint today. Use the calculator to log your first activity!',
    'system'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
