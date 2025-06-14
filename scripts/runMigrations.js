const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { migrate } = require('drizzle-orm/postgres-js/migrator');

async function runMigrations() {
  try {
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
    
    await client.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
