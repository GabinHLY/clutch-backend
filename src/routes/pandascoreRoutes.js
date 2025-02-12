const express = require("express");
const router = express.Router();
const {
  getUpcomingValorantMatches,
  getRunningValorantMatches,
  getPastValorantMatches,
  getTeamByName,
  getTeamStatsById,
  getTeams,
  getUpcomingVctMatches,
} = require("../services/pandascore"); // Chemin vers ton fichier pandascore.js

// ✅ Récupérer les matchs à venir de Valorant
router.get("/valorant/upcoming", async (req, res) => {
  try {
    const matches = await getUpcomingValorantMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des matchs à venir." });
  }
});

// ✅ Récupérer les matchs en cours de Valorant
router.get("/valorant/live", async (req, res) => {
  try {
    const matches = await getRunningValorantMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des matchs en direct." });
  }
});

// ✅ Récupérer les matchs passés de Valorant
router.get("/valorant/past", async (req, res) => {
  try {
    const matches = await getPastValorantMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des matchs passés." });
  }
});

// ✅ Récupérer une équipe par son nom
router.get("/team/:name", async (req, res) => {
  try {
    const teamId = await getTeamByName(req.params.name);
    if (!teamId) {
      return res.status(404).json({ error: "Équipe non trouvée." });
    }
    res.json({ teamId });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de l'équipe." });
  }
});

// ✅ Récupérer les stats d'une équipe par son ID
router.get("/team/stats/:id", async (req, res) => {
  try {
    const teamStats = await getTeamStatsById(req.params.id);
    res.json(teamStats);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des stats de l'équipe." });
  }
});

// ✅ Récupérer toutes les équipes d'un jeu spécifique (ex: "valorant")
router.get("/:game/teams", async (req, res) => {
  try {
    const teams = await getTeams(req.params.game);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: `Erreur lors de la récupération des équipes de ${req.params.game}.` });
  }
});


// ✅ Récupérer les matchs à venir de VCT
router.get("/valorant/vct/upcoming", async (req, res) => {
  try {
    const matches = await getUpcomingVctMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des matchs VCT à venir." });
  }
});


module.exports = router;
