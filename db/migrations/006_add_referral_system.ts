import type { Sql } from 'postgres';

export async function up(sql: Sql) {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT`;
}

export async function down(sql: Sql) {
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS referral_code`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS referred_by`;
}
