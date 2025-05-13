// routes/players.js

import express from "express";
import { db } from "../db/index.js";
import { players } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const allPlayers = await db.select().from(players);
    res.json(allPlayers);
  } catch (err) {
    console.error("Erreur /players:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des joueurs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const found = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    if (!found.length) return res.status(404).json({ error: "Joueur non trouvé" });
    res.json(found[0]);
  } catch (err) {
    console.error("Erreur /players/:id:", err);
    res.status(500).json({ error: "Erreur lors de la récupération du joueur" });
  }
});

export default router;
