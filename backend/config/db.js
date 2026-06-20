import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL;

let pool = null;
let sqliteDb = null;
export let dbType = 'sqlite';

if (dbUrl) {
  dbType = 'postgres';
  pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  console.log('Database: Using PostgreSQL (Supabase/External)');
} else {
  dbType = 'sqlite';
  const dbPath = path.resolve('carbonlytix.db');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log(`Database: Using local SQLite fallback (${dbPath})`);
  if (process.env.VERCEL) {
    console.warn('WARNING: Running in Vercel environment but DATABASE_URL is not set. Local SQLite data changes will not persist across serverless function invocations!');
  }
}

// Unified Query Execution Wrapper
export const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      pool.query(text, params, (err, res) => {
        if (err) return reject(err);
        resolve({
          rows: res.rows,
          rowCount: res.rowCount,
        });
      });
    } else {
      // Convert PostgreSQL positional parameters ($1, $2, ...) to SQLite (?)
      const sqliteText = text.replace(/\$\d+/g, '?');
      
      // Check if it is a SELECT or other query to determine method
      const isSelect = sqliteText.trim().match(/^(select|with)/i);
      
      if (isSelect) {
        sqliteDb.all(sqliteText, params, (err, rows) => {
          if (err) return reject(err);
          resolve({
            rows: rows || [],
            rowCount: rows ? rows.length : 0,
          });
        });
      } else {
        sqliteDb.run(sqliteText, params, function (err) {
          if (err) return reject(err);
          resolve({
            rows: [],
            rowCount: this.changes,
            lastID: this.lastID,
          });
        });
      }
    }
  });
};

// SQLite Database Initialization Code
const initSqliteDatabase = async () => {
  if (dbType !== 'sqlite') return;

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      subscription_status TEXT DEFAULT 'free',
      current_level TEXT DEFAULT 'Beginner' NOT NULL,
      total_points INTEGER DEFAULT 0 NOT NULL,
      current_streak INTEGER DEFAULT 0 NOT NULL,
      highest_streak INTEGER DEFAULT 0 NOT NULL,
      last_activity_date TEXT,
      daily_emission_target REAL DEFAULT 15.00,
      monthly_emission_target REAL DEFAULT 450.00,
      preferences TEXT DEFAULT '{"notifications": true, "theme": "dark", "interests": []}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS emission_factors (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      factor REAL NOT NULL,
      unit TEXT NOT NULL,
      source TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, subcategory)
    )`,

    `CREATE TABLE IF NOT EXISTS carbon_activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      unit TEXT NOT NULL,
      emission_factor REAL NOT NULL,
      calculated_emissions REAL NOT NULL,
      activity_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS sustainability_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      category TEXT NOT NULL,
      target_reduction_pct REAL NOT NULL,
      target_emission REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      progress_pct REAL DEFAULT 0.00 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      criteria_type TEXT NOT NULL,
      criteria_value INTEGER NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    )`,

    `CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      image_url TEXT,
      category TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_id)
    )`,

    `CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      points_reward INTEGER NOT NULL DEFAULT 100,
      badge_reward_id TEXT REFERENCES badges(id) ON DELETE SET NULL,
      icon TEXT DEFAULT 'Trophy',
      status TEXT DEFAULT 'upcoming',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS challenge_participants (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'enrolled' NOT NULL,
      progress REAL DEFAULT 0.00 NOT NULL,
      enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      UNIQUE(challenge_id, user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS educational_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      author TEXT DEFAULT 'Carbonlytix Editorial',
      read_time_mins INTEGER DEFAULT 3 NOT NULL,
      read_count INTEGER DEFAULT 0 NOT NULL,
      bookmark_count INTEGER DEFAULT 0 NOT NULL,
      image_url TEXT,
      status TEXT DEFAULT 'published',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS bookmarked_resources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, resource_id)
    )`,

    `CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      report_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_emissions REAL NOT NULL,
      score INTEGER NOT NULL,
      pdf_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'system',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    for (const sql of tables) {
      await query(sql);
    }
    
    // Seed default emission factors if empty
    const checkFactors = await query('SELECT count(*) as count FROM emission_factors');
    if (checkFactors.rows[0].count === 0) {
      console.log('Database: Seeding default SQLite tables...');
      
      // Factors
      const factors = [
        ['transportation', 'car_petrol', 0.1800, 'km', 'EPA 2023'],
        ['transportation', 'car_diesel', 0.1700, 'km', 'EPA 2023'],
        ['transportation', 'car_hybrid', 0.1000, 'km', 'EPA 2023'],
        ['transportation', 'car_electric', 0.0500, 'km', 'Grid Average'],
        ['transportation', 'motorbike', 0.1100, 'km', 'DEFRA 2023'],
        ['transportation', 'bus', 0.0300, 'km', 'DEFRA'],
        ['transportation', 'train', 0.0200, 'km', 'DEFRA'],
        ['transportation', 'flight_short', 0.2500, 'km', 'ICAO'],
        ['transportation', 'flight_long', 0.1900, 'km', 'ICAO'],
        ['electricity', 'grid_coal', 0.9500, 'kWh', 'IPCC'],
        ['electricity', 'grid_gas', 0.4500, 'kWh', 'IPCC'],
        ['electricity', 'grid_mixed', 0.4750, 'kWh', 'World Average'],
        ['electricity', 'renewable_solar', 0.0400, 'kWh', 'Lifecycle'],
        ['electricity', 'renewable_wind', 0.0120, 'kWh', 'Lifecycle'],
        ['food', 'meat_heavy', 3.6000, 'meal', 'Poore & Nemecek'],
        ['food', 'meat_average', 2.1000, 'meal', 'Poore & Nemecek'],
        ['food', 'vegetarian', 0.8000, 'meal', 'Oxford'],
        ['food', 'vegan', 0.5000, 'meal', 'Oxford'],
        ['waste', 'landfill', 0.5000, 'kg', 'EPA WARM'],
        ['waste', 'recyclable', 0.0500, 'kg', 'Sorting Average'],
        ['waste', 'organic', 0.1000, 'kg', 'Compost'],
        ['waste', 'plastic', 0.8000, 'kg', 'Incineration'],
        ['waste', 'electronic', 2.2000, 'kg', 'E-waste Average'],
        ['water', 'tap_water', 0.0003, 'liter', 'Water UK'],
        ['water', 'bottled_water', 0.1200, 'liter', 'Lifecycle PET']
      ];

      for (const f of factors) {
        await query(
          'INSERT INTO emission_factors (id, category, subcategory, factor, unit, source) VALUES ($1, $2, $3, $4, $5, $6)',
          [crypto.randomUUID(), f[0], f[1], f[2], f[3], f[4]]
        );
      }

      // Badges
      const badges = [
        ['b1000000-0000-0000-0000-000000000001', 'Eco Novice', 'First activity logged in Carbonlytix.', 'onboarding', 'Sprout'],
        ['b1000000-0000-0000-0000-000000000002', 'Green Pedaler', 'Logged over 50km on bicycle or walking.', 'transportation', 'Bike'],
        ['b1000000-0000-0000-0000-000000000003', 'Watt Saver', 'Saved 50kWh of electricity in a single goal.', 'energy', 'Zap'],
        ['b1000000-0000-0000-0000-000000000004', 'Plant Powered', 'Logged 10 vegetarian or vegan meals consecutively.', 'food', 'Leaf'],
        ['b1000000-0000-0000-0000-000000000005', 'Zero Waste Hero', 'Completed No Plastic Week challenge.', 'waste', 'Trash'],
        ['b1000000-0000-0000-0000-000000000006', 'Carbon Conqueror', 'Maintained a 7-day logging streak.', 'streaks', 'Flame'],
        ['b1000000-0000-0000-0000-000000000007', 'Earth Guardian', 'Reached the highest eco level.', 'levels', 'ShieldAlert']
      ];

      for (const b of badges) {
        await query(
          'INSERT INTO badges (id, title, description, category, image_url) VALUES ($1, $2, $3, $4, $5)',
          [b[0], b[1], b[2], b[3], b[4]]
        );
      }

      // Achievements
      const achievements = [
        [crypto.randomUUID(), 'First Step', 'Log your very first carbon activity.', 'points_earned', 10, 'Footprints'],
        [crypto.randomUUID(), 'Eco-Warrior Streak', 'Maintain a 5-day active streak logging your carbon footprint.', 'streak_days', 5, 'Flame'],
        [crypto.randomUUID(), 'Green Giant', 'Log a total carbon reduction of 100 kg CO2e.', 'emissions_reduced', 100, 'Trees'],
        [crypto.randomUUID(), 'Challenge Collector', 'Complete 3 environmental challenges.', 'challenges_completed', 3, 'Trophy'],
        [crypto.randomUUID(), 'Points Tycoon', 'Earn a total of 1,000 points on the platform.', 'points_earned', 1000, 'Award']
      ];

      for (const a of achievements) {
        await query(
          'INSERT INTO achievements (id, title, description, criteria_type, criteria_value, icon) VALUES ($1, $2, $3, $4, $5, $6)',
          a
        );
      }

      // Challenges
      const challenges = [
        ['c1000000-0000-0000-0000-000000000001', 'No Plastic Week', 'Avoid single-use plastics for 7 days. Track your progress by recycling and swapping plastic items with eco-friendly alternatives.', 'waste', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), 250, 'b1000000-0000-0000-0000-000000000005', 'Ban', 'active'],
        ['c1000000-0000-0000-0000-000000000002', 'Cycle to Work Challenge', 'Swap car trips with bicycle commuting. Travel at least 20 km in total by bike or foot during this challenge.', 'transportation', new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), 300, 'b1000000-0000-0000-0000-000000000002', 'Bike', 'upcoming'],
        ['c1000000-0000-0000-0000-000000000003', 'Energy Saving Week', 'Reduce household electricity consumption. Switch off lights, unplug idle chargers, and rely on renewable energy sources.', 'electricity', new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), 200, 'b1000000-0000-0000-0000-000000000003', 'Zap', 'completed'],
        ['c1000000-0000-0000-0000-000000000004', 'Water Conservation Challenge', 'Reduce daily water usage by taking shorter showers (under 5 minutes) and repairing leaks.', 'water', new Date().toISOString().slice(0,10), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), 150, null, 'Droplet', 'active']
      ];

      for (const c of challenges) {
        await query(
          'INSERT INTO challenges (id, title, description, category, start_date, end_date, points_reward, badge_reward_id, icon, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          c
        );
      }

      // Educational resources
      const articles = [
        [
          crypto.randomUUID(),
          'Understanding Your Carbon Footprint', 
          'A carbon footprint is the total amount of greenhouse gases (including carbon dioxide and methane) that are generated by our actions. The average global carbon footprint for a person is close to 4 tons. However, to have the best chance of avoiding a 2℃ rise in global temperatures, the average global carbon footprint per year needs to drop to under 2 tons by 2050. Your carbon footprint includes direct emissions, such as those that come from burning fuel in your car or heating your home. It also includes indirect emissions from the electricity you consume, the food you eat, and the products you buy. Understanding which categories contribute most to your personal footprint is the first step toward reducing it.', 
          'general', 'Carbonlytix Editorial', 4, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
        ],
        [
          crypto.randomUUID(),
          'The Impact of Dietary Habits on Climate Change', 
          'Did you know that food production accounts for one-quarter of the world’s greenhouse gas emissions? Meat and dairy products have a significantly higher carbon footprint than plant-based alternatives. Producing 1 kg of beef, for example, results in approximately 60 kg of greenhouse gases (CO2 equivalents), whereas producing 1 kg of peas emits less than 1 kg. Making simple swaps—like participating in Meatless Mondays or shifting to a vegetarian or vegan diet—can drastically reduce your personal emissions. If everyone reduced their meat consumption by 50%, global agricultural emissions would drop by more than a third, saving millions of acres of forest lands.', 
          'food', 'Carbonlytix Editorial', 5, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
        ],
        [
          crypto.randomUUID(),
          'Energy Efficiency at Home: Small Changes, Big Savings', 
          'Heating, cooling, and powering our homes consumes a massive amount of energy, much of which is wasted. Switching to LED lighting uses up to 80% less energy than traditional incandescent bulbs and lasts 25 times longer. Unplugging appliances when they aren’t in use prevents "phantom loads"—energy drawn even when turned off, which can account for up to 10% of a household’s electric bill. Additionally, choosing renewable energy options from your utility provider or installing solar panels can immediately reduce your electricity-related carbon emissions to near zero.', 
          'energy', 'Carbonlytix Editorial', 3, 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
        ],
        [
          crypto.randomUUID(),
          'Sustainable Transportation: Navigating the Green Way', 
          'Transportation is one of the largest sectors of greenhouse gas emissions worldwide, dominated by road travel. A single passenger car emits about 4.6 metric tons of carbon dioxide per year under average driving conditions. Walking, biking, or riding transit are the cleanest options. For longer distances, trains are far superior to flights: a short-haul flight can emit up to 10 times more carbon per passenger-kilometer than an electric train trip. If driving is unavoidable, maintaining proper tire pressure, avoiding idling, carpooling, and driving hybrid or electric vehicles can substantially lower emissions.', 
          'transport', 'Carbonlytix Editorial', 5, 'https://images.unsplash.com/photo-1519003722824-192d992a6058?auto=format&fit=crop&w=800&q=80'
        ],
        [
          crypto.randomUUID(),
          'The Truth About Recycling and Circular Economy', 
          'Recycling is vital, but reducing and reusing waste is even more critical. Only 9% of all plastic waste ever produced has been recycled. The rest ends up in landfills, incinerators, or polluting oceans. Adopting a "Zero Waste" lifestyle involves rethinking consumption: purchasing products with minimal packaging, choosing glass or aluminum over plastic, composting organic kitchen waste (which reduces methane production in landfills), and properly recycling electronic waste. A circular economy aims to design out waste and keep materials in use, minimizing raw material extraction and disposal emissions.', 
          'waste', 'Carbonlytix Editorial', 4, 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
        ]
      ];

      for (const a of articles) {
        await query(
          'INSERT INTO educational_resources (id, title, content, category, author, read_time_mins, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          a
        );
      }
      
      console.log('Database: SQLite seeding complete.');
    }
  } catch (error) {
    console.error('Database: SQLite initialization failed:', error);
  }
};

initSqliteDatabase();
