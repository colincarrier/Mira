import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function updateVectorColumns() {
  try {
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    console.log('Creating vector extension...');
    await client`CREATE EXTENSION IF NOT EXISTS vector`;
    
    console.log('Checking current vector_dense column type...');
    const result = await client`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notes' AND column_name = 'vector_dense'
    `;
    
    if (result.length > 0) {
      console.log('Current vector_dense type:', result[0].data_type);
      
      if (result[0].data_type === 'text') {
        console.log('Converting vector columns to proper vector types...');
        
        // Update vector_dense to vector(3072)
        await client`
          ALTER TABLE notes 
          ALTER COLUMN vector_dense TYPE vector(3072) 
          USING CASE 
            WHEN vector_dense IS NULL THEN NULL 
            ELSE vector_dense::vector 
          END
        `;
        
        // Update vector_sparse to vector(1536)  
        await client`
          ALTER TABLE notes 
          ALTER COLUMN vector_sparse TYPE vector(1536)
          USING CASE 
            WHEN vector_sparse IS NULL THEN NULL 
            ELSE vector_sparse::vector 
          END
        `;
        
        console.log('Vector columns updated successfully');
      } else {
        console.log('Vector columns already have correct types');
      }
    }
    
    await client.end();
  } catch (error) {
    console.error('Vector column update failed:', error);
    process.exit(1);
  }
}

updateVectorColumns();
