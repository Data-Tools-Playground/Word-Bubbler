// Database connection and configuration for Profile Building & Evolution System

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'word_bubble_profiles',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Create Drizzle database instance
export const db = drizzle(pool, { schema });

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}

// Initialize database tables (for development)
export async function initializeDatabase(): Promise<void> {
  try {
    // In production, use proper migrations
    // For development, we could create tables here if they don't exist
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Error handling wrapper for database operations
export async function withDatabaseTransaction<T>(
  operation: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    try {
      return await operation(tx);
    } catch (error) {
      console.error('Database transaction failed:', error);
      throw error;
    }
  });
}

export default db;