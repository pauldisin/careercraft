import type { Sql } from 'postgres';

export async function up(sql: Sql) {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_analysis_trial INTEGER DEFAULT 0`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_trial INTEGER DEFAULT 0`;
}

export async function down(sql: Sql) {
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS has_used_analysis_trial`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS has_used_trial`;
}
