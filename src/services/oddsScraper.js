const express = require("express");
const router = express.Router();
const connection = require("../config/db");
const { scrapeLiquipediaTeam } = require("./LiquipediaScraper");

// 📌 Fonction pour calculer les cotes basées sur le Win Rate et la Différence de Rounds
function calculateOdds(teamAStats, teamBStats) {
    if (!teamAStats || !teamBStats) return { teamA: null, teamB: null };

    const winRateDiff = teamAStats.winRate - teamBStats.winRate;
    const roundDiff = teamAStats.roundDifference - teamBStats.roundDifference;

    let probabilityA = 50 + (winRateDiff * 0.5) + (roundDiff * 2);
    let probabilityB = 100 - probabilityA;

    probabilityA = Math.max(10, Math.min(probabilityA, 90));
    probabilityB = 100 - probabilityA;

    const oddsA = (100 / probabilityA).toFixed(2);
    const oddsB = (100 / probabilityB).toFixed(2);

    return { teamA: oddsA, teamB: oddsB };
}

// 📌 Route API pour récupérer les cotes d'un match par son ID
router.get("/:match_id", async (req, res) => {
    const { match_id } = req.params;

    try {
        const [odds] = await connection.execute("SELECT * FROM odds WHERE match_id = ?", [match_id]);

        if (odds.length === 0) {
            return res.status(404).json({ message: "Aucune cote trouvée pour ce match." });
        }

        console.log(`✅ Cotes récupérées pour le match ${match_id}:`, odds[0]);

        res.json(odds[0]);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des cotes :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des cotes" });
    }
});

// 📌 Route API pour calculer les cotes uniquement pour les nouveaux matchs
router.post("/calculate", async (req, res) => {
    try {
        // 🔄 Récupérer les matchs en base
        const [matches] = await connection.execute("SELECT id, team_a, team_b FROM matches");

        if (matches.length === 0) {
            return res.json({ message: "Aucun match en base pour calculer les cotes." });
        }

        console.log(`📊 ${matches.length} matchs trouvés en base. Vérification des cotes...`);

        const results = [];

        for (const match of matches) {
            const { id, team_a, team_b } = match;

            // 🔍 Vérifier si les cotes existent déjà
            const [existingOdds] = await connection.execute("SELECT * FROM odds WHERE match_id = ?", [id]);

            if (existingOdds.length > 0) {
                console.log(`✅ Cotes déjà enregistrées pour ${team_a} vs ${team_b}, pas de recalcul.`);
                results.push({
                    match_id: id,
                    teamA: { name: team_a, odds: existingOdds[0].team_a_odds },
                    teamB: { name: team_b, odds: existingOdds[0].team_b_odds },
                });
                continue;
            }

            console.log(`📌 Calcul des cotes pour ${team_a} vs ${team_b}...`);

            // 🔥 Scraping des stats des équipes
            const teamAStats = await scrapeLiquipediaTeam(team_a);
            const teamBStats = await scrapeLiquipediaTeam(team_b);

            if (!teamAStats || !teamBStats || isNaN(teamAStats.winRate) || isNaN(teamBStats.winRate)) {
                console.log(`⚠️ Impossible de récupérer les stats pour ${team_a} ou ${team_b}, saut du match.`);
                continue;
            }

            // 🏆 Calcul des cotes
            const odds = calculateOdds(teamAStats, teamBStats);
            console.log(`📊 Cotes calculées : ${team_a} (${odds.teamA}) vs ${team_b} (${odds.teamB})`);

            // 💾 Stockage en base de données
            await connection.execute(
                "INSERT INTO odds (match_id, team_a_odds, team_b_odds, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
                [id, odds.teamA, odds.teamB]
            );

            results.push({
                match_id: id,
                teamA: { name: team_a, odds: odds.teamA },
                teamB: { name: team_b, odds: odds.teamB },
            });
        }

        console.log("✅ Fin du calcul des cotes !");
        res.json(results);
    } catch (error) {
        console.error("❌ Erreur dans oddsScraper :", error);
        res.status(500).json({ error: "Erreur lors du calcul des cotes" });
    }
});

// 🔥 Correction de l'export pour éviter les erreurs
module.exports = router;
