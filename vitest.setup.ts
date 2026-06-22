import '@testing-library/jest-dom';
import { beforeAll } from 'vitest';
import { db } from './db/schema';
import { migrate } from 'drizzle-orm/pglite/migrator';

beforeAll(async () => {
  console.log('[Test Setup] Running auto-migrations for testing database...');
  try {
    await migrate(db as any, { migrationsFolder: './db/drizzle' });
    console.log('[Test Setup] Auto-migrations completed successfully!');
  } catch (err) {
    console.error('[Test Setup] Failed to run migrations:', err);
  }
});
