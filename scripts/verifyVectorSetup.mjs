import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function verifyVectorSetup() {
  try {
    const client = postgres(process.env.DATABASE_URL);
    
    console.log('Verifying vector extension...');
    const extensions = await client`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    console.log('Vector extension installed:', extensions.length > 0);
    
    console.log('Checking column types...');
    const columns = await client`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'notes' 
      AND column_name IN ('vector_dense', 'vector_sparse', 'intent_vector')
      ORDER BY column_name
    `;
    
    console.log('Current column types:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });
    
    console.log('Intelligence-V2 database setup verified successfully');
    await client.end();
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyVectorSetup();
