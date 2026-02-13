-- Migration des données de Schedule (openTime, closeTime) vers TimeSlot
-- Ce script copie les horaires existants vers la nouvelle table TimeSlot

-- Insérer les TimeSlots pour tous les schedules qui ne sont pas fermés
INSERT INTO "TimeSlot" ("id", "scheduleId", "startTime", "endTime", "order")
SELECT
    gen_random_uuid() as "id",
    "id" as "scheduleId",
    "openTime" as "startTime",
    "closeTime" as "endTime",
    0 as "order"
FROM "Schedule"
WHERE "isClosed" = false
  AND "openTime" IS NOT NULL
  AND "closeTime" IS NOT NULL
  AND "openTime" != ''
  AND "closeTime" != ''
ON CONFLICT DO NOTHING;

-- Vérifier les données migrées
SELECT
    s."salonId",
    s."dayOfWeek",
    s."openTime" as "old_openTime",
    s."closeTime" as "old_closeTime",
    t."startTime" as "new_startTime",
    t."endTime" as "new_endTime"
FROM "Schedule" s
LEFT JOIN "TimeSlot" t ON t."scheduleId" = s."id"
WHERE s."isClosed" = false
ORDER BY s."salonId", s."dayOfWeek";
