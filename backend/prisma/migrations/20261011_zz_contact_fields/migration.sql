CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

ALTER TABLE "Student"
  ADD COLUMN "gender" "Gender",
  ADD COLUMN "email" VARCHAR(255),
  ADD COLUMN "phoneNumber" VARCHAR(16);

ALTER TABLE "User"
  ADD COLUMN "gender" "Gender",
  ADD COLUMN "phoneNumber" VARCHAR(16);
