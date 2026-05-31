-- Update existing ORGANIZER users to SUPER_ADMIN
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE role = 'ORGANIZER';

-- Create new enum type without ORGANIZER
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'PARTICIPANT');

-- Update the column to use the new type
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT';

-- Drop old enum
DROP TYPE "UserRole";

-- Rename new enum
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
