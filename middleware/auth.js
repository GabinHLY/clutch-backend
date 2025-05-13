//middleware/auth.js

import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies[process.env.SESSION_COOKIE_NAME];
  console.log("🍪 Cookie reçu :", token);

  if (!token) {
    console.log("⛔ Aucun token fourni");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = await db.select().from(sessions).where(eq(sessions.sessionToken, token)).limit(1);
  if (!session.length) {
    console.log("⛔ Session introuvable");
    return res.status(401).json({ error: "Session not found" });
  }

  const sessionData = session[0];
  console.log("✅ Session trouvée :", sessionData);

  if (new Date(sessionData.expiresAt) < new Date()) {
    console.log("⛔ Session expirée");
    return res.status(401).json({ error: "Session expired" });
  }

  const user = await db.select().from(users).where(eq(users.id, sessionData.userId)).limit(1);
  if (!user.length) {
    console.log("⛔ Utilisateur introuvable");
    return res.status(401).json({ error: "User not found" });
  }

  console.log("✅ Utilisateur attaché :", user[0]);
  req.user = user[0];
  next();
};
