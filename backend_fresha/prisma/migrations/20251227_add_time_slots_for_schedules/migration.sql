-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('VACATION', 'SICK_LEAVE', 'PERSONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable Schedule: remove openTime and closeTime columns
ALTER TABLE "Schedule" DROP COLUMN IF EXISTS "closeTime",
DROP COLUMN IF EXISTS "openTime";

-- CreateTable TimeSlot
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable BookingService
CREATE TABLE "BookingService" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "order" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable Absence
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "type" "AbsenceType" NOT NULL DEFAULT 'OTHER',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- AlterTable Salon: add buffer columns
ALTER TABLE "Salon" ADD COLUMN "bufferBefore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "bufferAfter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "processingTime" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Booking: make staffId and serviceId nullable, add isMultiService
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_staffId_fkey",
DROP CONSTRAINT IF EXISTS "Booking_serviceId_fkey";

ALTER TABLE "Booking" ALTER COLUMN "staffId" DROP NOT NULL,
ALTER COLUMN "serviceId" DROP NOT NULL,
ADD COLUMN "isMultiService" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "TimeSlot_scheduleId_idx" ON "TimeSlot"("scheduleId");
CREATE INDEX "TimeSlot_order_idx" ON "TimeSlot"("order");

-- CreateIndex
CREATE UNIQUE INDEX "BookingService_bookingId_serviceId_order_key" ON "BookingService"("bookingId", "serviceId", "order");
CREATE INDEX "BookingService_bookingId_idx" ON "BookingService"("bookingId");
CREATE INDEX "BookingService_serviceId_idx" ON "BookingService"("serviceId");
CREATE INDEX "BookingService_staffId_idx" ON "BookingService"("staffId");

-- CreateIndex
CREATE INDEX "Absence_staffId_idx" ON "Absence"("staffId");
CREATE INDEX "Absence_salonId_idx" ON "Absence"("salonId");
CREATE INDEX "Absence_startDate_idx" ON "Absence"("startDate");
CREATE INDEX "Absence_endDate_idx" ON "Absence"("endDate");
CREATE INDEX "Absence_status_idx" ON "Absence"("status");

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-add foreign keys for Booking with nullable columns
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
