-- Seed predefined locations: Aberdeen + Generic
INSERT INTO locations (name, category, lat, lng) VALUES
  -- Aberdeen locations
  ('RGU Garthdee Campus',       'aberdeen', 57.1190, -2.1368),
  ('Aberdeen Train Station',    'aberdeen', 57.1437, -2.0985),
  ('Aberdeen Bus Station',      'aberdeen', 57.1450, -2.0940),
  ('Union Square',              'aberdeen', 57.1440, -2.0960),
  ('University of Aberdeen',    'aberdeen', 57.1644, -2.1000),
  ('Aberdeen Royal Infirmary',  'aberdeen', 57.1528, -2.1275),
  ('Bridge of Don',             'aberdeen', 57.1780, -2.0900),
  ('Dyce',                      'aberdeen', 57.2060, -2.1620),
  ('Cove Bay',                  'aberdeen', 57.0890, -2.1090),
  ('Torry',                     'aberdeen', 57.1340, -2.0840),
  ('Rosemount',                 'aberdeen', 57.1530, -2.1130),
  ('Old Aberdeen',              'aberdeen', 57.1670, -2.0990),
  ('Altens Industrial Estate',  'aberdeen', 57.1070, -2.0850),
  ('Kingswells',                'aberdeen', 57.1580, -2.1930),
  ('Westhill',                  'aberdeen', 57.1540, -2.2690),
  ('Aberdeen Airport',          'aberdeen', 57.2019, -2.1978),
  -- Generic locations
  ('Home',                      'generic',  NULL, NULL),
  ('Office',                    'generic',  NULL, NULL),
  ('University',                'generic',  NULL, NULL),
  ('Train Station',             'generic',  NULL, NULL),
  ('Shopping Centre',           'generic',  NULL, NULL),
  ('Gym',                       'generic',  NULL, NULL),
  ('Park',                      'generic',  NULL, NULL),
  ('Hospital',                  'generic',  NULL, NULL)
ON CONFLICT DO NOTHING;
