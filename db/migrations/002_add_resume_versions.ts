import type { Sql } from "postgres";

export async function up(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS resume_versions (
      id TEXT PRIMARY KEY,
      resume_id TEXT,
      data TEXT,
      template TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    );
  `;
}

export async function down(sql: Sql) {
  await sql`
    DROP TABLE IF EXISTS resume_versions;
  `;
}
