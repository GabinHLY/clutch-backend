// routes/teams.js

import express from "express";
import { db } from "../db/index.js";
import { teams, players } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const allTeams = await db.select().from(teams);
    res.json(allTeams);
  } catch (err) {
    console.error("Erreur /teams:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des équipes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const found = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!found.length) return res.status(404).json({ error: "Équipe non trouvée" });
    res.json(found[0]);
  } catch (err) {
    console.error("Erreur /teams/:id:", err);
    res.status(500).json({ error: "Erreur lors de la récupération de l'équipe" });
  }
});

router.get("/:id/players", async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const teamPlayers = await db.select().from(players).where(eq(players.teamId, teamId));
    res.json(teamPlayers);
  } catch (err) {
    console.error("Erreur /teams/:id/players:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des joueurs" });
  }
});

export default router;
