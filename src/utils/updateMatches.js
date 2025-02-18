const connection = require("../config/db");
const { getUpcomingValorantMatches } = require("../services/pandascore");
const moment = require("moment-timezone");
const axios = require("axios"); // ✅ Utilisation d'axios pour appeler l'API des cotes

// 🔄 Mapping des statuts de PandaScore vers ceux de MySQL
const statusMapping = {
    upcoming: "upcoming",
    running: "ongoing",
    finished: "finished",
};

async function saveUpcomingMatches() {
    console.log("🔄 Début de la mise à jour des matchs...");

    try {
        const upcomingMatches = await getUpcomingValorantMatches();
        console.log(`📊 ${upcomingMatches.length} matchs récupérés depuis PandaScore`);

        const newMatches = [];

        for (const match of upcomingMatches) {
            const { id, game, team_a, team_b, start_time, status } = match;

            console.log(`📌 Vérification du match ID: ${id} (${team_a.name} vs ${team_b.name})`);

            // ✅ Formatage correct de la date pour MySQL
            const formattedStartTime = moment(start_time).tz("UTC").format("YYYY-MM-DD HH:mm:ss");

            // ✅ Vérification et correction du statut
            const convertedStatus = statusMapping[status] || "upcoming"; // Par défaut "upcoming" si inconnu

            // ✅ Vérifier si le match existe déjà en base
            const [existingMatch] = await connection.execute("SELECT id FROM matches WHERE id = ?", [id]);

            if (existingMatch.length > 0) {
                console.log(`✅ Match déjà en base, pas d'insertion nécessaire.`);
                continue;
            }

            // ✅ Insertion du match en base
            console.log(`✅ Insertion du match : ${team_a.name} vs ${team_b.name}...`);
            await connection.execute(
                "INSERT INTO matches (id, game, team_a, team_b, start_time, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
                [id, game, team_a.name, team_b.name, formattedStartTime, convertedStatus]
            );

            console.log(`🟢 Match ajouté en base : ${team_a.name} vs ${team_b.name}`);
            newMatches.push({ id, team_a: team_a.name, team_b: team_b.name });
        }

        console.log("✅ Fin de la mise à jour des matchs !");

        // 🔥 Lancer le calcul des cotes UNIQUEMENT si de nouveaux matchs ont été ajoutés
        if (newMatches.length > 0) {
            console.log("📊 Lancement du calcul des cotes pour les nouveaux matchs...");

            try {
                const response = await axios.post("http://localhost:3000/api/odds/calculate", { matches: newMatches });
                console.log("✅ Cotes mises à jour :", response.data);
            } catch (error) {
                console.error("❌ Erreur lors de la mise à jour des cotes :", error.message);
            }
        } else {
            console.log("⏭ Aucun nouveau match ajouté, pas de recalcul des cotes nécessaire.");
        }

    } catch (error) {
        console.error("❌ Erreur dans saveUpcomingMatches :", error);
    }
}

module.exports = { saveUpcomingMatches };
