-- Sequence allocation is atomic, so simultaneous student creates receive distinct numbers.
CREATE SEQUENCE IF NOT EXISTS "student_admission_seq" AS BIGINT START WITH 1000;
