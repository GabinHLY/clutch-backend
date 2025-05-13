// routes/auth.js

import express from "express";
import crypto from "crypto";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await hashPassword(password);

  // insertion de l'utilisateur avec 100 jetons initiaux
  const result = await db
    .insert(users)
    .values({
      email,
      password: hashed,
      tokens: 100,
    });

  console.log("Inserted user:", result);

  res.json({ success: true });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!found.length || !(await comparePassword(password, found[0].password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 jours

  await db.insert(sessions).values({
    userId: found[0].id,
    sessionToken: token,
    expiresAt,
  });

  res.cookie(process.env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // true en prod
    sameSite: "lax",
    expires: expiresAt,
  });

  res.json({ success: true });
});

router.get("/me", authMiddleware, (req, res) => {
  // renvoyer aussi le nombre de jetons restants
  const { id, email, createdAt, tokens } = req.user;
  res.json({ id, email, createdAt, tokens });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies[process.env.SESSION_COOKIE_NAME];
  await db
    .delete(sessions)
    .where(eq(sessions.sessionToken, token));
  res.clearCookie(process.env.SESSION_COOKIE_NAME);
  res.json({ success: true });
});

export default router;
