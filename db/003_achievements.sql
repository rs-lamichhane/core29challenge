-- Seed achievements
INSERT INTO achievements (key, title, description, icon, threshold_type, threshold_value) VALUES
  ('first_journey',    'First Step',           'Log your first journey',                    '👣', 'journey_count',  1),
  ('five_journeys',    'Regular Commuter',     'Log 5 journeys',                            '🚶', 'journey_count',  5),
  ('twenty_journeys',  'Journey Master',       'Log 20 journeys',                           '🗺️', 'journey_count',  20),
  ('co2_1kg',          'Carbon Cutter',        'Save 1 kg of CO2 vs driving',               '🌱', 'co2_saved_g',    1000),
  ('co2_5kg',          'Green Guardian',       'Save 5 kg of CO2 vs driving',               '🌿', 'co2_saved_g',    5000),
  ('co2_20kg',         'Planet Protector',     'Save 20 kg of CO2 vs driving',              '🌍', 'co2_saved_g',    20000),
  ('cal_500',          'Calorie Starter',      'Burn 500 kcal through active commuting',    '🔥', 'calories_kcal',  500),
  ('cal_1000',         'Calorie Crusher',      'Burn 1,000 kcal through active commuting',  '💪', 'calories_kcal',  1000),
  ('cal_5000',         'Fitness Machine',      'Burn 5,000 kcal through active commuting',  '🏅', 'calories_kcal',  5000),
  ('streak_3',         'Hat Trick',            'Maintain a 3-day sustainable streak',        '⚡', 'streak',         3),
  ('streak_7',         'Week Warrior',         'Maintain a 7-day sustainable streak',        '🔥', 'streak',         7),
  ('streak_30',        'Monthly Legend',       'Maintain a 30-day sustainable streak',       '👑', 'streak',         30)
ON CONFLICT (key) DO NOTHING;
