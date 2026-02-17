-- Require GiST operator support for equality + range overlap constraints.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping active bookings for the same staff member.
ALTER TABLE "Booking"
ADD CONSTRAINT "booking_staff_no_overlaps_active"
EXCLUDE USING gist (
  "staffId" WITH =,
  tstzrange("startTime", "endTime", '[)') WITH &&
)
WHERE (
  "staffId" IS NOT NULL
  AND "status" NOT IN ('CANCELED', 'NO_SHOW')
);

-- Prevent overlapping active bookings for the same client.
ALTER TABLE "Booking"
ADD CONSTRAINT "booking_client_no_overlaps_active"
EXCLUDE USING gist (
  "clientId" WITH =,
  tstzrange("startTime", "endTime", '[)') WITH &&
)
WHERE (
  "status" NOT IN ('CANCELED', 'NO_SHOW')
);
