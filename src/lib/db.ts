import { neon } from '@neondatabase/serverless';

export function getDb() {
  return neon(process.env.DATABASE_URL!);
}

let migrated = false;

export async function ensureTables() {
  if (migrated) return;
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at      timestamptz NOT NULL DEFAULT now(),
      status          text NOT NULL DEFAULT 'submitted',
      betrieb         jsonb NOT NULL,
      app_data        jsonb NOT NULL,
      contact_email   text,
      contact_name    text,
      ip              text,
      user_agent      text,
      notes           text
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS submission_files (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id     uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      mitarbeiter_id    text NOT NULL,
      mitarbeiter_label text NOT NULL,
      kind              text NOT NULL CHECK (kind IN ('erhebungsbogen', 'angebot', 'merged')),
      blob_path         text NOT NULL,
      blob_url          text NOT NULL,
      file_name         text NOT NULL,
      size_bytes        int,
      created_at        timestamptz NOT NULL DEFAULT now()
    )
  `;
  // Migration: relax old CHECK constraint that did not include 'merged'
  await sql`
    DO $$ BEGIN
      ALTER TABLE submission_files DROP CONSTRAINT IF EXISTS submission_files_kind_check;
      ALTER TABLE submission_files ADD CONSTRAINT submission_files_kind_check
        CHECK (kind IN ('erhebungsbogen', 'angebot', 'merged'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_submission_files_submission
    ON submission_files(submission_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_downloads (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id       uuid REFERENCES submission_files(id) ON DELETE CASCADE,
      submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
      kind          text NOT NULL,
      admin_email   text NOT NULL,
      downloaded_at timestamptz NOT NULL DEFAULT now(),
      ip            text
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS file_tokens (
      token            text PRIMARY KEY,
      file_id          uuid NOT NULL REFERENCES submission_files(id) ON DELETE CASCADE,
      created_at       timestamptz NOT NULL DEFAULT now(),
      expires_at       timestamptz NOT NULL,
      used_at          timestamptz,
      used_ip          text,
      used_user_agent  text
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_file_tokens_expires ON file_tokens(expires_at)
  `;

  migrated = true;
}
