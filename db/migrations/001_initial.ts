import type { Sql } from "postgres";

export async function up(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      stripe_customer_id TEXT,
      subscription_status TEXT,
      subscription_plan TEXT,
      credits INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount INTEGER,
      currency TEXT,
      status TEXT,
      plan TEXT,
      type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      data TEXT,
      template TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export async function down(sql: Sql) {
  await sql`DROP TABLE IF EXISTS resumes;`;
  await sql`DROP TABLE IF EXISTS transactions;`;
  await sql`DROP TABLE IF EXISTS app_settings;`;
  await sql`DROP TABLE IF EXISTS users;`;
}
