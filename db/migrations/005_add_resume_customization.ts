import postgres from 'postgres';

export async function up(sql: postgres.Sql) {
  await sql`
    ALTER TABLE resumes 
    ADD COLUMN IF NOT EXISTS accent_color TEXT,
    ADD COLUMN IF NOT EXISTS font_family TEXT;
  `;

  await sql`
    ALTER TABLE resume_versions 
    ADD COLUMN IF NOT EXISTS accent_color TEXT,
    ADD COLUMN IF NOT EXISTS font_family TEXT;
  `;
}

export async function down(sql: postgres.Sql) {
  await sql`
    ALTER TABLE resumes 
    DROP COLUMN IF EXISTS accent_color,
    DROP COLUMN IF EXISTS font_family;
  `;

  await sql`
    ALTER TABLE resume_versions 
    DROP COLUMN IF EXISTS accent_color,
    DROP COLUMN IF EXISTS font_family;
  `;
}
