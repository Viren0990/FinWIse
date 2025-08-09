import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
const sql = neon(
  "postgresql://neondb_owner:npg_ORFr4XAfP9tn@ep-holy-cloud-a8x3oua2-pooler.eastus2.azure.neon.tech/finance?sslmode=require"
);
export const db = drizzle(sql, { schema });