//db/index.js

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";
import "dotenv/config";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("✅ Connected to:", process.env.DATABASE_URL); // 👈 ajoute ça

export const db = drizzle(connection, {
  schema,
  mode: "default",
});
