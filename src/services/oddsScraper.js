const express = require("express");
const router = express.Router();
const connection = require("../config/db");
const { scrapeLiquipediaTeam } = require("./LiquipediaScraper");

// 🏆 Fonction pour calculer les cotes basées sur le Win Rate et la Différence de Rounds
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

    return {
        teamA: oddsA,
        teamB: oddsB,
    };
}

// 🚀 Fonction principale pour calculer les cotes de tous les matchs en base
async function scrapeOdds() {
    try {
        // 🔄 Récupérer les matchs stockés dans la base de données
        const [matches] = await connection.execute("SELECT id, team_a, team_b FROM matches");

        if (matches.length === 0) {
            console.log("⚠️ Aucun match en base pour calculer les cotes.");
            return [];
        }

        console.log(`📊 ${matches.length} matchs trouvés en base. Calcul des cotes en cours...`);

        const results = [];

        for (const match of matches) {
            const { id, team_a, team_b } = match;

            console.log(`📌 Analyse du match : ${team_a} vs ${team_b}`);

            // 🔍 Scraping des stats des équipes sur Liquipedia
            const teamAStats = await scrapeLiquipediaTeam(team_a);
            const teamBStats = await scrapeLiquipediaTeam(team_b);

            if (!teamAStats || !teamBStats || isNaN(teamAStats.winRate) || isNaN(teamBStats.winRate)) {
                console.log(`⚠️ Stats indisponibles pour ${team_a} ou ${team_b}, saut du match.`);
                continue;
            }

            // 📊 Calcul des cotes
            const odds = calculateOdds(teamAStats, teamBStats);
            console.log(`📊 Cotes calculées : ${team_a} (${odds.teamA}) vs ${team_b} (${odds.teamB})`);

            // 💾 Stockage en base de données
            await connection.execute(
                "INSERT INTO odds (match_id, team_a_odds, team_b_odds, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE team_a_odds = ?, team_b_odds = ?, updated_at = NOW()",
                [id, odds.teamA, odds.teamB, odds.teamA, odds.teamB]
            );

            results.push({
                match_id: id,
                teamA: { name: team_a, odds: odds.teamA },
                teamB: { name: team_b, odds: odds.teamB },
            });
        }

        console.log("✅ Fin du calcul des cotes !");
        return results;
    } catch (error) {
        console.error("❌ Erreur dans scrapeOdds :", error);
        throw error;
    }
}

// 📌 Route API pour recalculer les cotes sur demande
router.post("/calculate", async (req, res) => {
    try {
        const results = await scrapeOdds();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du calcul des cotes" });
    }
});

// 🚀 Export des fonctions pour utilisation dans `updateMatches.js`
module.exports = { scrapeOdds, router };
