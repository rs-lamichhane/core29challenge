-- Seed demo users
INSERT INTO users (id, name, avatar_color) VALUES
  (1,  'You',            '#10B981'),
  (2,  'Emma Green',     '#3B82F6'),
  (3,  'Liam Walker',    '#F59E0B'),
  (4,  'Sophia Pedal',   '#EF4444'),
  (5,  'Noah Tracks',    '#8B5CF6'),
  (6,  'Olivia Runner',  '#EC4899'),
  (7,  'James Cycle',    '#14B8A6'),
  (8,  'Mia Transit',    '#F97316'),
  (9,  'Ethan Swift',    '#6366F1'),
  (10, 'Ava Stride',     '#06B6D4'),
  (11, 'Ben Eco',        '#84CC16'),
  (12, 'Chloe Miles',    '#D946EF')
ON CONFLICT DO NOTHING;

SELECT setval('users_id_seq', 12);

-- Seed streaks for all users
INSERT INTO streaks (user_id, current_streak, best_streak, last_journey_date) VALUES
  (1,  0, 0,  NULL),
  (2,  5, 12, CURRENT_DATE - 1),
  (3,  3, 7,  CURRENT_DATE),
  (4,  8, 15, CURRENT_DATE),
  (5,  2, 5,  CURRENT_DATE - 1),
  (6,  12,20, CURRENT_DATE),
  (7,  7, 7,  CURRENT_DATE),
  (8,  1, 4,  CURRENT_DATE - 2),
  (9,  4, 9,  CURRENT_DATE - 1),
  (10, 6, 6,  CURRENT_DATE),
  (11, 0, 3,  CURRENT_DATE - 5),
  (12, 9, 14, CURRENT_DATE)
ON CONFLICT (user_id) DO NOTHING;

-- Helper function for seeding journeys
DO $$
DECLARE
  u RECORD;
  j_id INTEGER;
  d NUMERIC;
  m VARCHAR(20);
  modes VARCHAR(20)[] := ARRAY['walk','cycle','e-scooter','bus','train'];
  speeds NUMERIC[] := ARRAY[5,15,18,20,35];
  overheads NUMERIC[] := ARRAY[0,0,0,5,8];
  co2s NUMERIC[] := ARRAY[0,0,20,80,40];
  cals NUMERIC[] := ARRAY[50,30,10,0,0];
  idx INTEGER;
  t_min NUMERIC;
  co2 NUMERIC;
  cal NUMERIC;
  dt_min NUMERIC;
  dco2 NUMERIC;
  dcal NUMERIC;
  drive_t NUMERIC;
  drive_co2 NUMERIC;
BEGIN
  FOR u IN SELECT id FROM users WHERE id BETWEEN 2 AND 12 LOOP
    FOR i IN 1..FLOOR(RANDOM()*12 + 5)::INT LOOP
      idx := FLOOR(RANDOM()*5 + 1)::INT;
      IF idx > 5 THEN idx := 5; END IF;
      m := modes[idx];
      d := ROUND((RANDOM()*15 + 1)::NUMERIC, 1);

      t_min := ROUND((d / speeds[idx]) * 60 + overheads[idx], 2);
      co2 := ROUND(d * co2s[idx], 2);
      cal := ROUND(d * cals[idx], 2);
      drive_t := ROUND((d / 30) * 60 + 3, 2);
      drive_co2 := ROUND(d * 170, 2);
      dco2 := drive_co2 - co2;
      dt_min := ROUND(t_min - drive_t, 2);
      dcal := cal;

      INSERT INTO journeys (user_id, date, distance_km, mode)
        VALUES (u.id, CURRENT_DATE - (FLOOR(RANDOM()*30))::INT, d, m)
        RETURNING id INTO j_id;

      INSERT INTO journey_results (journey_id, time_min, co2_g, calories_kcal, vs_drive_co2_saved_g, vs_drive_time_delta_min, vs_drive_calories_delta_kcal, drive_time_min, drive_co2_g)
        VALUES (j_id, t_min, co2, cal, dco2, dt_min, dcal, drive_t, drive_co2);
    END LOOP;
  END LOOP;
END $$;

-- Seed some achievements for demo users
INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT u.id, a.id, NOW() - (RANDOM() * INTERVAL '30 days')
FROM users u
CROSS JOIN achievements a
WHERE u.id BETWEEN 2 AND 12
  AND RANDOM() < 0.3
ON CONFLICT DO NOTHING;
