import type { Sql } from "postgres";

export async function up(sql: Sql) {
  // Add columns if they don't exist
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`;

  // Backfill existing users
  await sql`UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL`;
  await sql`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE last_login IS NULL`;
}

export async function down(sql: Sql) {
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS email`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS name`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS created_at`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS last_login`;
}
