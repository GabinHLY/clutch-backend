const express = require("express");
const { scrapeLiquipediaTeam } = require("../services/LiquipediaScraper");

const router = express.Router();

// 🟢 Route pour récupérer les statistiques d'une équipe
router.get("/:teamName", async (req, res) => {
    const teamName = req.params.teamName;

    if (!teamName) {
        return res.status(400).json({ error: "Nom de l'équipe requis" });
    }

    try {
        const teamStats = await scrapeLiquipediaTeam(teamName);
        if (!teamStats) {
            return res.status(500).json({ error: "Impossible de récupérer les stats" });
        }
        res.json(teamStats);
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des stats pour ${teamName} :`, error.message);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

module.exports = router;
