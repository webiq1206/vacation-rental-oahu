import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Ensure both development and production use the same database
// This forces a single database for both environments as requested
const databaseUrl = process.env.DATABASE_URL;

console.log('Database connection URL:', databaseUrl.substring(0, 50) + '...');

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
