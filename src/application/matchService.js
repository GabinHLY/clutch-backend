// matchService.js
import apiClient from '../infrastructure/apiClient.js';
import db from '../config/database.js';
import moment from 'moment-timezone';

/**
 * Récupérer les matchs PandaScore selon un statut donné (upcoming, running, past)
 */
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

/**
 * Récupérer uniquement les matchs VCT (limité à 10)
 */
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

/**
 * Récupérer les matchs à venir depuis PandaScore et les enregistrer en BDD (limité à 20)
 * (Ancienne fonction de synchro manuelle)
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

        for (const match of matches.slice(0, 20)) {
            const teamA = match.opponents[0]?.opponent || { name: "TBD", image_url: null };
            const teamB = match.opponents[1]?.opponent || { name: "TBD", image_url: null };
            const formattedStartTime = moment(match.start_time).tz("UTC").format("YYYY-MM-DD HH:mm:ss");

            // Récupération du stream
            let streamURL = match.stream_url || null;
            if (!streamURL) {
                const mainStream = match.streams_list?.find(stream => stream.main);
                streamURL = mainStream ? mainStream.raw_url : null;
            }

            console.log(`📝 Match: ${match.id} - ${teamA.name} vs ${teamB.name}`);
            console.log(`🎥 Stream URL final utilisé: ${streamURL}`);

            await db.query(
                `INSERT INTO matches 
                    (id, game, team_a, team_a_logo, team_b, team_b_logo, start_time, result, status, stream_url, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE 
                    status = ?, 
                    updated_at = NOW(),
                    stream_url = ?,
                    team_a_logo = ?,
                    team_b_logo = ?`,
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
                    streamURL,
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

/**
 * Récupérer les matchs à venir depuis la base de données
 */
async function getUpcomingMatchesFromDB() {
    try {
        const [matches] = await db.query("SELECT * FROM matches WHERE status = 'upcoming' ORDER BY start_time ASC LIMIT 20");
        return matches;
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs à venir depuis la base de données :", error.message);
        throw new Error("Impossible de récupérer les matchs à venir.");
    }
}

/**
 * Helper: Upsert d'un match en BDD
 */
async function upsertMatch(match) {
    const teamA = match.opponents[0]?.opponent || { name: 'TBD', image_url: null };
    const teamB = match.opponents[1]?.opponent || { name: 'TBD', image_url: null };
    
    // Formatage de la date
    const formattedStartTime = moment(match.begin_at).tz('UTC').format('YYYY-MM-DD HH:mm:ss');

    // Récupération du stream principal si disponible
    let streamURL = match.stream_url || null;
    if (!streamURL && match.streams_list) {
        const mainStream = match.streams_list.find(s => s.main);
        if (mainStream) streamURL = mainStream.raw_url;
    }

    // Insert or update
    await db.query(
        `INSERT INTO matches 
          (id, game, team_a, team_a_logo, team_b, team_b_logo, start_time, status, result, stream_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           game = VALUES(game),
           team_a = VALUES(team_a),
           team_a_logo = VALUES(team_a_logo),
           team_b = VALUES(team_b),
           team_b_logo = VALUES(team_b_logo),
           start_time = VALUES(start_time),
           stream_url = VALUES(stream_url),
           updated_at = NOW()
        `,
        [
            match.id,
            'Valorant',
            teamA.name,
            teamA.image_url,
            teamB.name,
            teamB.image_url,
            formattedStartTime,
            'upcoming',   // Par défaut on insère en "upcoming"
            'pending',    // result par défaut
            streamURL
        ]
    );
}

/**
 * Nouvelle fonction AUTOMATIQUE : 
 * - s'assure qu'il y a toujours 20 matchs 'upcoming'
 * - met à jour les matchs 'upcoming' -> 'ongoing' quand ils commencent
 * - met à jour les matchs 'ongoing' -> 'finished' quand PandaScore indique qu'ils sont terminés
 */
async function autoSyncMatches() {
    try {
        // 1) Vérifier s'il y a moins de 20 matchs 'upcoming'
        const [rows] = await db.query("SELECT COUNT(*) as cnt FROM matches WHERE status = 'upcoming'");
        const upcomingCount = rows[0].cnt;

        if (upcomingCount < 20) {
            console.log(`Il n'y a que ${upcomingCount} matchs 'upcoming'. On en récupère de nouveaux via PandaScore...`);
            const { data } = await apiClient.get('valorant/matches/upcoming');
            // On insère/maj en BDD (limite à 30 pour ne pas tout importer d'un coup)
            for (const match of data.slice(0, 30)) {
                await upsertMatch(match);
            }
        }

        // 2) Passer les matchs 'upcoming' en 'ongoing' si l'heure de début est dépassée
        const [upcomingMatches] = await db.query("SELECT id, start_time FROM matches WHERE status = 'upcoming'");
        const now = moment();
        for (const match of upcomingMatches) {
            if (moment(match.start_time).isSameOrBefore(now)) {
                await db.query("UPDATE matches SET status = 'ongoing', updated_at = NOW() WHERE id = ?", [match.id]);
                console.log(`Match ${match.id} -> 'ongoing'`);
            }
        }

        // 3) Vérifier les matchs 'ongoing' pour voir s'ils sont terminés (selon l'API)
        // 3) Vérifier les matchs 'ongoing' pour voir s'ils sont terminés (selon l'API)
const [ongoingMatches] = await db.query("SELECT id FROM matches WHERE status = 'ongoing'");
for (const matchRow of ongoingMatches) {
    try {
        const { data: matchData } = await apiClient.get(`valorant/matches/${matchRow.id}`);
        // Si matchData est un tableau, on prend le premier élément
        const matchInfo = Array.isArray(matchData) ? matchData[0] : matchData;

        if (matchInfo && (matchInfo.status === 'finished' || matchInfo.status === 'completed')) {
            // Récupérer les scores
            const teamAId = matchInfo.opponents[0]?.opponent.id;
            const teamBId = matchInfo.opponents[1]?.opponent.id;
            const teamAScore = matchInfo.results?.find(r => r.team_id === teamAId)?.score || 0;
            const teamBScore = matchInfo.results?.find(r => r.team_id === teamBId)?.score || 0;

            // Déterminer le vainqueur
            let finalResult = 'draw';
            if (teamAScore > teamBScore) {
                finalResult = 'team_a';
            } else if (teamBScore > teamAScore) {
                finalResult = 'team_b';
            }

            await db.query(`
                UPDATE matches
                SET status = 'finished', 
                    result = ?, 
                    updated_at = NOW()
                WHERE id = ?
            `, [finalResult, matchRow.id]);

            console.log(`Match ${matchRow.id} terminé. Score final: ${teamAScore} - ${teamBScore}`);
        }
    } catch (err) {
        // Gestion spécifique pour l'erreur 404
        if (err.response && err.response.status === 404) {
            console.warn(`Match ${matchRow.id} non trouvé dans l'API (404). Il peut être déjà terminé ou archivé.`);
            // Optionnel : mettre à jour le match en "finished" avec un résultat par défaut
            // await db.query("UPDATE matches SET status = 'finished', updated_at = NOW() WHERE id = ?", [matchRow.id]);
        } else {
            console.error(`Erreur lors de la vérification du match ${matchRow.id} :`, err.message);
        }
    }
}


        console.log("✅ Synchronisation automatique terminée.");
    } catch (error) {
        console.error("❌ Erreur dans autoSyncMatches :", error.message);
    }
}

export {
    getMatchesByStatus,
    getUpcomingVctMatches,
    syncUpcomingMatchesToDB,
    getUpcomingMatchesFromDB,
    autoSyncMatches // nouvelle fonction
};
