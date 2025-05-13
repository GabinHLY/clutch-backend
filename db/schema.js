// db/schema.js

import { mysqlTable, serial, varchar, datetime, int, decimal } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  tokens: int("tokens").notNull().default(sql`100`),
});

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expires_at").notNull(),
});

export const matches = mysqlTable("matches", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tournamentName: varchar("tournament_name", { length: 255 }).default(null),
  team1Id: int("team1_id").notNull(),
  team2Id: int("team2_id").notNull(),
  startTime: datetime("start_time").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("not_started"),
  // ── Côtes calculées localement
  oddsTeam1: decimal("odds_team1", { precision: 5, scale: 2 }).notNull().default(sql`1.00`),
  oddsTeam2: decimal("odds_team2", { precision: 5, scale: 2 }).notNull().default(sql`1.00`),
  oddsUpdatedAt: datetime("odds_updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  streamLink: varchar("stream_link", { length: 1000 }).default(null),
});

export const teams = mysqlTable("teams", {
  id: int("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  acronym: varchar("acronym", { length: 50 }),
  slug: varchar("slug", { length: 255 }),
  imageUrl: varchar("image_url", { length: 1000 }),
  rating: int("rating").notNull().default(1500), // si vous implémentez l'ELO
});

export const players = mysqlTable("players", {
  id: int("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  age: int("age"),
  nationality: varchar("nationality", { length: 100 }),
  imageUrl: varchar("image_url", { length: 1000 }),
  teamId: int("team_id"),
});
