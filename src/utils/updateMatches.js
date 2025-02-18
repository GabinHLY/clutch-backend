const connection = require('../config/db'); 
const { getUpcomingValorantMatches } = require('../services/pandascore'); 
const moment = require('moment-timezone'); 

const statusMapping = {
    'upcoming': 'upcoming',  
    'running': 'ongoing',    
    'past': 'finished'       
};

const { scrapeOdds } = require("../services/oddsScraper");

async function saveUpcomingMatches() {
    console.log("🔄 Début de la mise à jour des matchs...");

    try {
        const upcomingMatches = await getUpcomingValorantMatches();
        console.log(`📊 ${upcomingMatches.length} matchs récupérés depuis PandaScore`);

        for (const match of upcomingMatches) {
            const { id, game, team_a, team_b, start_time, status } = match;

            console.log(`📌 Vérification du match ID: ${id} (${team_a.name} vs ${team_b.name})`);

            // Vérifier si le match existe déjà
            const [existingMatch] = await connection.execute("SELECT id FROM matches WHERE id = ?", [id]);

            if (existingMatch.length > 0) {
                console.log(`✅ Match déjà en base, pas d'insertion nécessaire.`);
                continue;
            }

            console.log(`✅ Insertion du match : ${team_a.name} vs ${team_b.name}...`);
            await connection.execute(
                "INSERT INTO matches (id, game, team_a, team_b, start_time, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
                [id, game, team_a.name, team_b.name, start_time, status]
            );

            console.log(`🟢 Match ajouté en base : ${team_a.name} vs ${team_b.name}`);
        }

        console.log("✅ Fin de la mise à jour des matchs !");

        // 🔥 Appel de oddsScraper pour calculer les cotes dès qu'un match est ajouté
        console.log("📊 Lancement du calcul des cotes...");
        await scrapeOdds();

    } catch (error) {
        console.error("❌ Erreur dans saveUpcomingMatches :", error);
    }
}


module.exports = { saveUpcomingMatches };
