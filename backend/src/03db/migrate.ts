import { sql } from "kysely";
import { db } from "./database.js";

export async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient JSONB NOT NULL,
      chief_complaint TEXT NOT NULL,
      anamnesis JSONB NOT NULL DEFAULT '[]',
      procedures JSONB NOT NULL DEFAULT '[]',
      diagnosis_name VARCHAR(255) NOT NULL,
      diagnosis_icd VARCHAR(20),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS user_cases (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, case_id)
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `.execute(db);

  await sql`
    ALTER TABLE cases
    ALTER COLUMN patient DROP NOT NULL,
    ALTER COLUMN chief_complaint DROP NOT NULL,
    ALTER COLUMN anamnesis DROP NOT NULL,
    ALTER COLUMN procedures DROP NOT NULL,
    ALTER COLUMN created_at DROP NOT NULL;
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_user_case
    ON messages (user_id, case_id, created_at);
  `.execute(db);

  console.log("✅ Migrations complete.");
}
