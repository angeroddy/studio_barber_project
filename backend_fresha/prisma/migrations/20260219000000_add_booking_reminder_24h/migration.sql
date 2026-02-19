-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reminder24hSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder24hSentAt" TIMESTAMP(3);
