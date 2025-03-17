import apiClient from '../infrastructure/apiClient.js';
import db from '../config/database.js';
import moment from 'moment-timezone';

/**
 * 🔹 Mapping des statuts entre PandaScore et la BDD
 */
const statusMapping = {
    upcoming: 'upcoming',
    running: 'ongoing',
    past: 'finished',
    not_started: 'upcoming',
    finished: 'finished'
};

/**
 * 1️⃣ Récupérer les matchs PandaScore selon un statut donné (upcoming, running, past)
 */
async function getMatchesByStatus(status) {
    try {
        const { data } = await apiClient.get(`valorant/matches/${status}`);

        return data.map((match) => {
            const matchStatus = statusMapping[match?.status] || 'upcoming';
            const teamA = match.opponents?.[0]?.opponent || { id: 0, name: 'TBD', image_url: null };
            const teamB = match.opponents?.[1]?.opponent || { id: 0, name: 'TBD', image_url: null };
            
            const teamAScore = match.results?.find((result) => result.team_id === teamA.id)?.score || 0;
            const teamBScore = match.results?.find((result) => result.team_id === teamB.id)?.score || 0;
            
            // Déterminer le résultat du match si terminé
            let result = 'pending';
            if (matchStatus === 'finished') {
                if (teamAScore > teamBScore) {
                    result = 'team_a';
                } else if (teamBScore > teamAScore) {
                    result = 'team_b';
                } else {
                    result = 'draw';
                }
            }

            return {
                id: match.id,
                game: 'Valorant',
                team_a: {
                    id: teamA.id,
                    name: teamA.name,
                    logo: teamA.image_url,
                    score: teamAScore,
                },
                team_b: {
                    id: teamB.id,
                    name: teamB.name,
                    logo: teamB.image_url,
                    score: teamBScore,
                },
                serie: {
                    name: match.serie?.name || 'Unknown Series',
                    logo: match.league?.image_url || null,
                },
                start_time: match.begin_at,
                status: matchStatus,
                result: result,
                stream_url: match.streams_list?.find((stream) => stream.main)?.raw_url || null,
            };
        });
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des matchs ${status} :`, error.message);
        throw new Error(`Impossible de récupérer les matchs ${status} depuis PandaScore.`);
    }
}


/**
 * 2️⃣ Synchronisation des matchs à venir (upcoming) avec la BDD
 */
async function syncUpcomingMatchesToDB() {
    try {
        console.log("🔄 Tentative de synchronisation des 20 prochains matchs...");

        const { data: matches } = await apiClient.get('valorant/matches/upcoming');

        if (!matches || matches.length === 0) {
            console.log("⚠️ Aucun match à venir trouvé via PandaScore.");
            return;
        }

        console.log(`✅ ${matches.length} matchs récupérés depuis PandaScore`);
        console.log(matches.map(m => ({ id: m.id, status: m.status }))); // 👀 Voir les statuts reçus

        for (const match of matches.slice(0, 20)) {
            await upsertMatch(match);
        }

        console.log("✅ 20 matchs enregistrés en BDD avec leurs stream URLs.");
    } catch (error) {
        console.error("❌ Erreur lors de la synchronisation des matchs :", error.message);
    }
}

/**
 * 3️⃣ Insertion/Mise à jour des matchs en BDD (évite les doublons)
 */
async function upsertMatch(match) {
    const teamA = match.opponents?.[0]?.opponent || { id: 0, name: 'TBD', image_url: null };
    const teamB = match.opponents?.[1]?.opponent || { id: 0, name: 'TBD', image_url: null };
    
    const formattedStartTime = moment(match.begin_at).tz('UTC').format('YYYY-MM-DD HH:mm:ss');
    
    let streamURL = match.stream_url || null;
    if (!streamURL && match.streams_list) {
        const mainStream = match.streams_list.find(s => s.main);
        if (mainStream) streamURL = mainStream.raw_url;
    }

    let matchStatus = statusMapping[match?.status] || 'upcoming';
    
    // Récupérer les scores pour les matchs en cours ou terminés
    const teamAScore = match.results?.find((result) => result.team_id === teamA.id)?.score || 0;
    const teamBScore = match.results?.find((result) => result.team_id === teamB.id)?.score || 0;
    
    // Déterminer le résultat du match si terminé
    let result = 'pending';
    if (matchStatus === 'finished') {
        if (teamAScore > teamBScore) {
            result = 'team_a';
        } else if (teamBScore > teamAScore) {
            result = 'team_b';
        } else {
            result = 'draw';
        }
    }

    await db.query(
        `INSERT INTO matches 
          (id, game, team_a_id, team_a, team_a_logo, team_b_id, team_b, team_b_logo, team_a_score, team_b_score, start_time, status, result, stream_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           team_a_id = VALUES(team_a_id),
           team_a = VALUES(team_a),
           team_a_logo = VALUES(team_a_logo),
           team_b_id = VALUES(team_b_id),
           team_b = VALUES(team_b),
           team_b_logo = VALUES(team_b_logo),
           team_a_score = VALUES(team_a_score),
           team_b_score = VALUES(team_b_score),
           start_time = VALUES(start_time),
           status = VALUES(status),
           result = VALUES(result),
           stream_url = VALUES(stream_url),
           updated_at = NOW()`,
        [
            match.id,
            'Valorant',
            teamA.id,
            teamA.name,
            teamA.image_url,
            teamB.id,
            teamB.name,
            teamB.image_url,
            teamAScore,
            teamBScore,
            formattedStartTime,
            matchStatus,
            result,
            streamURL
        ]
    );
}

/**
 * 4️⃣ Mise à jour des scores en direct pour les matchs "ongoing"
 */
async function updateLiveMatchScores() {
    try {
        const [ongoingMatches] = await db.query("SELECT id FROM matches WHERE status = 'ongoing'");

        if (ongoingMatches.length === 0) {
            console.log("✅ Aucun match en direct à mettre à jour.");
            return;
        }

        for (const matchRow of ongoingMatches) {
            try {
                const { data: matchData } = await apiClient.get(`valorant/matches?filter[id]=${matchRow.id}`);
                const matchInfo = Array.isArray(matchData) ? matchData[0] : matchData;

                if (matchInfo) {
                    const teamAId = matchInfo.opponents[0]?.opponent.id;
                    const teamBId = matchInfo.opponents[1]?.opponent.id;
                    const teamAScore = matchInfo.results?.find(r => r.team_id === teamAId)?.score || 0;
                    const teamBScore = matchInfo.results?.find(r => r.team_id === teamBId)?.score || 0;
                    
                    // Vérifier si le match est terminé
                    const matchStatus = statusMapping[matchInfo.status] || 'ongoing';
                    let result = 'pending';
                    
                    if (matchStatus === 'finished') {
                        if (teamAScore > teamBScore) {
                            result = 'team_a';
                        } else if (teamBScore > teamAScore) {
                            result = 'team_b';
                        } else {
                            result = 'draw';
                        }
                    }

                    await db.query(
                        `UPDATE matches
                         SET team_a_score = ?, 
                             team_b_score = ?, 
                             status = ?,
                             result = ?,
                             updated_at = NOW()
                         WHERE id = ?`,
                        [teamAScore, teamBScore, matchStatus, result, matchRow.id]
                    );

                    console.log(`✅ Match ${matchRow.id} mis à jour: ${teamAScore} - ${teamBScore}, statut: ${matchStatus}`);
                }
            } catch (err) {
                console.error(`❌ Erreur lors de la mise à jour du match ${matchRow.id} :`, err.message);
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des scores en direct :", error.message);
    }
}

/**
 * 5️⃣ Mise à jour des équipes des matchs "TBD"
 */
async function updateTbdMatches() {
    try {
        const [tbdMatches] = await db.query("SELECT id FROM matches WHERE team_a = 'TBD' OR team_b = 'TBD'");

        if (tbdMatches.length === 0) {
            console.log("✅ Aucun match avec équipes TBD à mettre à jour.");
            return;
        }

        for (const matchRow of tbdMatches) {
            try {
                const { data: matchData } = await apiClient.get(`valorant/matches?filter[id]=${matchRow.id}`);
                const matchInfo = Array.isArray(matchData) ? matchData[0] : matchData;

                if (matchInfo) {
                    const teamA = matchInfo.opponents[0]?.opponent || { id: 0, name: "TBD", image_url: null };
                    const teamB = matchInfo.opponents[1]?.opponent || { id: 0, name: "TBD", image_url: null };

                    await db.query(
                        `UPDATE matches
                         SET team_a = ?, 
                             team_b = ?, 
                             team_a_id = ?,
                             team_b_id = ?,
                             team_a_logo = ?, 
                             team_b_logo = ?, 
                             updated_at = NOW()
                         WHERE id = ?`,
                        [teamA.name, teamB.name, teamA.id, teamB.id, teamA.image_url, teamB.image_url, matchRow.id]
                    );
                    
                    console.log(`✅ Équipes mises à jour pour match ${matchRow.id}: ${teamA.name} vs ${teamB.name}`);
                }
            } catch (err) {
                console.error(`❌ Erreur lors de la mise à jour du match ${matchRow.id} :`, err.message);
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des matchs TBD :", error.message);
    }
}

/**
 * 6️⃣ Vérifie et met à jour le statut des matchs (upcoming → ongoing)
 */
async function updateMatchesStatus() {
    try {
        // 1. D'abord mettre à jour les matchs qui devraient passer de upcoming à ongoing
        const now = new Date();
        const [upcomingToOngoing] = await db.query(
            "SELECT id FROM matches WHERE status = 'upcoming' AND start_time <= ?",
            [now]
        );
        
        if (upcomingToOngoing.length > 0) {
            console.log(`🔄 ${upcomingToOngoing.length} matchs passent de upcoming à ongoing`);
            
            for (const match of upcomingToOngoing) {
                await db.query(
                    "UPDATE matches SET status = 'ongoing', updated_at = NOW() WHERE id = ?",
                    [match.id]
                );
                console.log(`✅ Match ${match.id} passé au statut 'ongoing'`);
            }
        }
        
        // 2. Ensuite, vérifier via l'API si certains matchs sont déjà terminés
        await updateLiveMatchScores();
        
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des statuts de matchs :", error.message);
    }
}

export { 
    getMatchesByStatus, 
    syncUpcomingMatchesToDB, 
    upsertMatch, 
    updateLiveMatchScores, 
    updateTbdMatches,
    updateMatchesStatus
};