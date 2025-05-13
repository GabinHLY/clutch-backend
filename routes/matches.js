// routes/matches.js

import express from "express";
import { db } from "../db/index.js";
import { matches, teams } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

const enrichMatch = async (match) => {
  const team1 = match.team1Id ? await db.select().from(teams).where(eq(teams.id, match.team1Id)).limit(1) : [];
  const team2 = match.team2Id ? await db.select().from(teams).where(eq(teams.id, match.team2Id)).limit(1) : [];
  return {
    ...match,
    team1: team1[0] || null,
    team2: team2[0] || null,
  };
};

router.get("/", async (req, res) => {
  try {
    const allMatches = await db.select().from(matches);
    const matchesWithTeams = await Promise.all(allMatches.map(enrichMatch));
    res.json(matchesWithTeams);
  } catch (err) {
    console.error("Erreur /matches:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des matchs" });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    const upcomingMatches = await db.select().from(matches).where(eq(matches.status, "not_started"));
    const enriched = await Promise.all(upcomingMatches.map(enrichMatch));
    res.json(enriched);
  } catch (err) {
    console.error("Erreur /matches/upcoming:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des matchs à venir" });
  }
});

router.get("/running", async (req, res) => {
  try {
    const runningMatches = await db.select().from(matches).where(eq(matches.status, "running"));
    const enriched = await Promise.all(runningMatches.map(enrichMatch));
    res.json(enriched);
  } catch (err) {
    console.error("Erreur /matches/running:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des matchs en cours" });
  }
});

router.get("/past", async (req, res) => {
  try {
    const pastMatches = await db.select().from(matches).where(eq(matches.status, "finished"));
    const enriched = await Promise.all(pastMatches.map(enrichMatch));
    res.json(enriched);
  } catch (err) {
    console.error("Erreur /matches/past:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des anciens matchs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const found = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!found.length) return res.status(404).json({ error: "Match non trouvé" });
    const enriched = await enrichMatch(found[0]);
    res.json(enriched);
  } catch (err) {
    console.error("Erreur /matches/:id:", err);
    res.status(500).json({ error: "Erreur lors de la récupération du match" });
  }
});

export default router;
