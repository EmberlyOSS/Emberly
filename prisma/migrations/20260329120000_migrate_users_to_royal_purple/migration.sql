-- Migrate all existing users to royal purple theme
UPDATE "User"
SET 
  theme = 'royal-purple',
  "customColors" = '{"background": "270 50% 7%", "foreground": "270 15% 95%", "card": "270 45% 9%", "cardForeground": "270 15% 95%", "popover": "270 45% 9%", "popoverForeground": "270 15% 95%", "primary": "263 68% 62%", "primaryForeground": "0 0% 100%", "secondary": "270 28% 15%", "secondaryForeground": "270 15% 95%", "muted": "270 22% 13%", "mutedForeground": "270 15% 60%", "accent": "280 38% 20%", "accentForeground": "270 15% 95%", "destructive": "0 62.8% 40%", "destructiveForeground": "0 0% 100%", "border": "270 28% 18%", "input": "270 28% 15%", "ring": "263 68% 62%"}'::jsonb
WHERE 
  theme IS NULL 
  OR theme = 'default-dark';
