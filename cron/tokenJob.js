// cron/tokenJob.js
import cron from "node-cron";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { sql } from "drizzle-orm";

export const startTokenJob = () => {
  cron.schedule("0 10 * * *", async () => {
    await db.update(users).set({ tokens: sql`tokens + 20` }).execute();
  });
};
