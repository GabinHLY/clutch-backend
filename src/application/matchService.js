import apiClient from '../infrastructure/apiClient.js';
import db from '../config/database.js';
import moment from 'moment-timezone';

// Récupérer les matchs avec un statut spécifique
async function getMatchesByStatus(status) {
    try {
        const { data } = await apiClient.get(`valorant/matches/${status}`);

        return data.map((match) => ({
            id: match.id,
            game: 'Valorant',
            team_a: {
                id: match.opponents[0]?.opponent.id || 'TBD',
                name: match.opponents[0]?.opponent.name || 'TBD',
                logo: match.opponents[0]?.opponent.image_url || null,
                score: match.results?.find((result) => result.team_id === match.opponents[0]?.opponent.id)?.score || 0,
            },
            team_b: {
                id: match.opponents[1]?.opponent.id || 'TBD',
                name: match.opponents[1]?.opponent.name || 'TBD',
                logo: match.opponents[1]?.opponent.image_url || null,
                score: match.results?.find((result) => result.team_id === match.opponents[1]?.opponent.id)?.score || 0,
            },
            serie: {
                name: match.serie?.name || 'Unknown Series',
                logo: match.league?.image_url || null,
            },
            start_time: match.begin_at,
            status: match.status,
            stream_url: match.streams_list?.find((stream) => stream.main)?.raw_url || null,
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des matchs ${status} :`, error.message);
        throw new Error(`Impossible de récupérer les matchs ${status} depuis PandaScore.`);
    }
}

// Récupérer uniquement les matchs VCT
async function getUpcomingVctMatches() {
    try {
        const { data } = await apiClient.get('valorant/matches/upcoming');

        const vctMatches = data.filter(match => match.league?.name.includes("VCT")).slice(0, 10);

        return vctMatches.map((match) => ({
            id: match.id,
            game: 'Valorant',
            team_a: {
                name: match.opponents[0]?.opponent.name || 'TBD',
                logo: match.opponents[0]?.opponent.image_url || null,
                score: match.results?.find((result) => result.team_id === match.opponents[0]?.opponent.id)?.score || 0,
            },
            team_b: {
                name: match.opponents[1]?.opponent.name || 'TBD',
                logo: match.opponents[1]?.opponent.image_url || null,
                score: match.results?.find((result) => result.team_id === match.opponents[1]?.opponent.id)?.score || 0,
            },
            serie: {
                name: match.serie?.name || 'Unknown Series',
                logo: match.league?.image_url || null,
            },
            start_time: match.begin_at,
            status: match.status,
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des matchs VCT :', error.message);
        throw new Error('Impossible de récupérer les matchs VCT à venir depuis PandaScore.');
    }
}


// Récupérer les matchs à venir depuis PandaScore et les enregistrer en BDD
async function syncUpcomingMatchesToDB() {
    try {
        console.log("🔄 Tentative de synchronisation des 20 prochains matchs...");

        const { data: matches } = await apiClient.get('valorant/matches/upcoming');

        if (!matches || matches.length === 0) {
            console.log("⚠️ Aucun match à venir trouvé via PandaScore.");
            return;
        }

        console.log(`✅ ${matches.length} matchs récupérés depuis PandaScore`);

        for (const match of matches.slice(0, 20)) {
            const teamA = match.opponents[0]?.opponent || { name: "TBD", image_url: null };
            const teamB = match.opponents[1]?.opponent || { name: "TBD", image_url: null };
            const formattedStartTime = moment(match.start_time).tz("UTC").format("YYYY-MM-DD HH:mm:ss");

            // 🔥 Vérification de `streams_list` pour récupérer le stream
            let streamURL = match.stream_url || null;
            if (!streamURL) {
                const mainStream = match.streams_list?.find(stream => stream.main);
                streamURL = mainStream ? mainStream.raw_url : null;
            }

            console.log(`📝 Match: ${match.id} - ${teamA.name} vs ${teamB.name}`);
            console.log(`🎥 Stream URL final utilisé: ${streamURL}`);

            await db.query(
                `INSERT INTO matches (id, game, team_a, team_a_logo, team_b, team_b_logo, start_time, result, status, stream_url, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE status = ?, updated_at = NOW(), stream_url = ?, team_a_logo = ?, team_b_logo = ?`,
                [
                    match.id,
                    'Valorant',
                    teamA.name,
                    teamA.image_url || null,
                    teamB.name,
                    teamB.image_url || null,
                    formattedStartTime,
                    'pending',
                    'upcoming',
                    streamURL, // 🔥 Maintenant on récupère bien le stream via `streams_list`
                    'upcoming',
                    streamURL,
                    teamA.image_url || null,
                    teamB.image_url || null
                ]
            );
        }

        console.log("✅ 20 matchs enregistrés en BDD avec leurs stream URLs.");
    } catch (error) {
        console.error("❌ Erreur lors de la synchronisation des matchs :", error.message);
    }
}


// Récupérer les matchs à venir depuis la base de données
async function getUpcomingMatchesFromDB() {
    try {
        const [matches] = await db.query("SELECT * FROM matches WHERE status = 'upcoming' ORDER BY start_time ASC LIMIT 20");
        return matches;
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs à venir depuis la base de données :", error.message);
        throw new Error("Impossible de récupérer les matchs à venir.");
    }
}


export { getMatchesByStatus, getUpcomingVctMatches, syncUpcomingMatchesToDB, getUpcomingMatchesFromDB };
