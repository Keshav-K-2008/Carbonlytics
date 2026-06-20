-- Carbonlytix Database Seed Data

-- 1. Insert Default Emission Factors
INSERT INTO emission_factors (category, subcategory, factor, unit, source) VALUES
-- Transportation (factor in kg CO2e per km)
('transportation', 'car_petrol', 0.1800, 'km', 'EPA 2023'),
('transportation', 'car_diesel', 0.1700, 'km', 'EPA 2023'),
('transportation', 'car_hybrid', 0.1000, 'km', 'EPA 2023'),
('transportation', 'car_electric', 0.0500, 'km', 'Grid average charge'),
('transportation', 'motorbike', 0.1100, 'km', 'DEFRA 2023'),
('transportation', 'bus', 0.0300, 'km', 'DEFRA (per passenger km)'),
('transportation', 'train', 0.0200, 'km', 'DEFRA (per passenger km)'),
('transportation', 'flight_short', 0.2500, 'km', 'ICAO (< 1500 km)'),
('transportation', 'flight_long', 0.1900, 'km', 'ICAO (> 1500 km)'),

-- Electricity (factor in kg CO2e per kWh)
('electricity', 'grid_coal', 0.9500, 'kWh', 'IPCC average'),
('electricity', 'grid_gas', 0.4500, 'kWh', 'IPCC average'),
('electricity', 'grid_mixed', 0.4750, 'kWh', 'World Average Grid'),
('electricity', 'renewable_solar', 0.0400, 'kWh', 'Lifecycle emissions'),
('electricity', 'renewable_wind', 0.0120, 'kWh', 'Lifecycle emissions'),

-- Food (factor in kg CO2e per meal)
('food', 'meat_heavy', 3.6000, 'meal', 'Poore & Nemecek 2018'),
('food', 'meat_average', 2.1000, 'meal', 'Poore & Nemecek 2018'),
('food', 'vegetarian', 0.8000, 'meal', 'Oxford University study'),
('food', 'vegan', 0.5000, 'meal', 'Oxford University study'),

-- Waste (factor in kg CO2e per kg)
('waste', 'landfill', 0.5000, 'kg', 'EPA WARM'),
('waste', 'recyclable', 0.0500, 'kg', 'Includes sorting/transport'),
('waste', 'organic', 0.1000, 'kg', 'Composting emissions'),
('waste', 'plastic', 0.8000, 'kg', 'Incineration/degradation factor'),
('waste', 'electronic', 2.2000, 'kg', 'E-waste processing average'),

-- Water (factor in kg CO2e per liter)
('water', 'tap_water', 0.0003, 'liter', 'Water UK'),
('water', 'bottled_water', 0.1200, 'liter', 'Lifecycle PET manufacturing');

-- 2. Insert Default Badges
INSERT INTO badges (id, title, description, category, image_url) VALUES
('b1000000-0000-0000-0000-000000000001', 'Eco Novice', 'First activity logged in Carbonlytix.', 'onboarding', 'Sprout'),
('b1000000-0000-0000-0000-000000000002', 'Green Pedaler', 'Logged over 50km on bicycle or walking.', 'transportation', 'Bike'),
('b1000000-0000-0000-0000-000000000003', 'Watt Saver', 'Saved 50kWh of electricity in a single goal.', 'energy', 'Zap'),
('b1000000-0000-0000-0000-000000000004', 'Plant Powered', 'Logged 10 vegetarian or vegan meals consecutively.', 'food', 'Leaf'),
('b1000000-0000-0000-0000-000000000005', 'Zero Waste Hero', 'Completed No Plastic Week challenge.', 'waste', 'Trash'),
('b1000000-0000-0000-0000-000000000006', 'Carbon Conqueror', 'Maintained a 7-day logging streak.', 'streaks', 'Flame'),
('b1000000-0000-0000-0000-000000000007', 'Earth Guardian', 'Reached the highest eco level.', 'levels', 'ShieldAlert');

-- 3. Insert Default Achievements
INSERT INTO achievements (title, description, criteria_type, criteria_value, icon) VALUES
('First Step', 'Log your very first carbon activity.', 'points_earned', 10, 'Footprints'),
('Eco-Warrior Streak', 'Maintain a 5-day active streak logging your carbon footprint.', 'streak_days', 5, 'Flame'),
('Green Giant', 'Log a total carbon reduction of 100 kg CO2e.', 'emissions_reduced', 100, 'Trees'),
('Challenge Collector', 'Complete 3 environmental challenges.', 'challenges_completed', 3, 'Trophy'),
('Points Tycoon', 'Earn a total of 1,000 points on the platform.', 'points_earned', 1000, 'Award');

-- 4. Insert Default Challenges
INSERT INTO challenges (id, title, description, category, start_date, end_date, points_reward, badge_reward_id, icon, status) VALUES
('c1000000-0000-0000-0000-000000000001', 'No Plastic Week', 'Avoid single-use plastics for 7 days. Track your progress by recycling and swapping plastic items with eco-friendly alternatives.', 'waste', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', 250, 'b1000000-0000-0000-0000-000000000005', 'Ban', 'active'),
('c1000000-0000-0000-0000-000000000002', 'Cycle to Work Challenge', 'Swap car trips with bicycle commuting. Travel at least 20 km in total by bike or foot during this challenge.', 'transportation', CURRENT_DATE + INTERVAL '1 days', CURRENT_DATE + INTERVAL '8 days', 300, 'b1000000-0000-0000-0000-000000000002', 'Bike', 'upcoming'),
('c1000000-0000-0000-0000-000000000003', 'Energy Saving Week', 'Reduce household electricity consumption. Switch off lights, unplug idle chargers, and rely on renewable energy sources.', 'electricity', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', 200, 'b1000000-0000-0000-0000-000000000003', 'Zap', 'completed'),
('c1000000-0000-0000-0000-000000000004', 'Water Conservation Challenge', 'Reduce daily water usage by taking shorter showers (under 5 minutes) and repairing leaks.', 'water', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 150, NULL, 'Droplet', 'active');

-- 5. Insert Default Educational Resources
INSERT INTO educational_resources (title, content, category, read_time_mins, image_url) VALUES
('Understanding Your Carbon Footprint', 
'A carbon footprint is the total amount of greenhouse gases (including carbon dioxide and methane) that are generated by our actions. The average global carbon footprint for a person is close to 4 tons. However, to have the best chance of avoiding a 2℃ rise in global temperatures, the average global carbon footprint per year needs to drop to under 2 tons by 2050.

Your carbon footprint includes direct emissions, such as those that come from burning fuel in your car or heating your home. It also includes indirect emissions from the electricity you consume, the food you eat, and the products you buy. Understanding which categories contribute most to your personal footprint is the first step toward reducing it.', 
'general', 4, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'),

('The Impact of Dietary Habits on Climate Change', 
'Did you know that food production accounts for one-quarter of the world’s greenhouse gas emissions? Meat and dairy products have a significantly higher carbon footprint than plant-based alternatives. Producing 1 kg of beef, for example, results in approximately 60 kg of greenhouse gases (CO2 equivalents), whereas producing 1 kg of peas emits less than 1 kg.

Making simple swaps—like participating in Meatless Mondays or shifting to a vegetarian or vegan diet—can drastically reduce your personal emissions. If everyone reduced their meat consumption by 50%, global agricultural emissions would drop by more than a third, saving millions of acres of forest lands.', 
'food', 5, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'),

('Energy Efficiency at Home: Small Changes, Big Savings', 
'Heating, cooling, and powering our homes consumes a massive amount of energy, much of which is wasted. Switching to LED lighting uses up to 80% less energy than traditional incandescent bulbs and lasts 25 times longer. Unplugging appliances when they aren’t in use prevents "phantom loads"—energy drawn even when turned off, which can account for up to 10% of a household’s electric bill.

Additionally, choosing renewable energy options from your utility provider or installing solar panels can immediately reduce your electricity-related carbon emissions to near zero.', 
'energy', 3, 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'),

('Sustainable Transportation: Navigating the Green Way', 
'Transportation is one of the largest sectors of greenhouse gas emissions worldwide, dominated by road travel. A single passenger car emits about 4.6 metric tons of carbon dioxide per year under average driving conditions. 

Walking, biking, or riding transit are the cleanest options. For longer distances, trains are far superior to flights: a short-haul flight can emit up to 10 times more carbon per passenger-kilometer than an electric train trip. If driving is unavoidable, maintaining proper tire pressure, avoiding idling, carpooling, and driving hybrid or electric vehicles can substantially lower emissions.', 
'transport', 5, 'https://images.unsplash.com/photo-1519003722824-192d992a6058?auto=format&fit=crop&w=800&q=80'),

('The Truth About Recycling and Circular Economy', 
'Recycling is vital, but reducing and reusing waste is even more critical. Only 9% of all plastic waste ever produced has been recycled. The rest ends up in landfills, incinerators, or polluting oceans. 

Adopting a "Zero Waste" lifestyle involves rethinking consumption: purchasing products with minimal packaging, choosing glass or aluminum over plastic, composting organic kitchen waste (which reduces methane production in landfills), and properly recycling electronic waste. A circular economy aims to design out waste and keep materials in use, minimizing raw material extraction and disposal emissions.', 
'waste', 4, 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80');
