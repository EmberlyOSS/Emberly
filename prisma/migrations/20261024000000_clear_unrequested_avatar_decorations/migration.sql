-- Avatar decorations were applied automatically from Discord. Keep them only on
-- profiles that use their Discord avatar, where the decoration fits.
UPDATE "User"
SET "avatarDecoration" = NULL
WHERE "avatarDecoration" IS NOT NULL
  AND ("image" IS NULL OR "image" NOT LIKE 'https://cdn.discordapp.com/%');
