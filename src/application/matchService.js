// matchService.js
import apiClient from '../infrastructure/apiClient.js';
import db from '../config/database.js';
import moment from 'moment-timezone';
import { syncPlayersByTeam } from './playerService.js';
import { upsertTeam } from './teamService.js';

/**
 * Mapping des statuts depuis PandaScore vers notre schéma :
 * - "not_started" et "upcoming" → "upcoming"
 * - "running" → "running"
 * - "finished" → "past"
 */
const statusMapping = {
  upcoming: 'upcoming',
  not_started: 'upcoming',
  running: 'running',
  finished: 'past'
};

/**
 * Récupération et mapping des matchs depuis PandaScore.
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

      let result = 'pending';
      if (matchStatus === 'past') {
        if (teamAScore > teamBScore) result = 'team_a';
        else if (teamBScore > teamAScore) result = 'team_b';
        else result = 'draw';
      }

      return {
        id: match.id,
        game: match.videogame ? match.videogame.name : 'Valorant',
        tournament_id: match.tournament ? match.tournament.id : null,
        team1: {
          id: teamA.id,
          name: teamA.name,
          logo: teamA.image_url,
          score: teamAScore,
        },
        team2: {
          id: teamB.id,
          name: teamB.name,
          logo: teamB.image_url,
          score: teamBScore,
        },
        serie: {
          name: match.serie?.name || 'Unknown Series',
          logo: match.league?.image_url || null,
        },
        date_match: match.begin_at,
        status: matchStatus,
        result: result,
        stream_url: match.streams_list?.find((stream) => stream.main)?.raw_url || null
      };
    });
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des matchs ${status} :`, error.message);
    throw new Error(`Impossible de récupérer les matchs ${status} depuis PandaScore.`);
  }
}

/**
 * Insertion/Mise à jour d'un match dans la BDD.
 */
async function upsertMatch(match) {
  const teamA = match.opponents?.[0]?.opponent || { id: 0, name: 'TBD', image_url: null };
  const teamB = match.opponents?.[1]?.opponent || { id: 0, name: 'TBD', image_url: null };

  // Upsert des équipes (assurez-vous que upsertTeam insère bien l'équipe dans la table teams)
  await upsertTeam(teamA);
  await upsertTeam(teamB);

  // Synchronisation des joueurs pour chaque équipe
  await syncPlayersByTeam(teamA.id);
  await syncPlayersByTeam(teamB.id);

  // Formatage de la date
  const formattedStartTime = moment(match.begin_at).tz('UTC').format('YYYY-MM-DD HH:mm:ss');

  let streamURL = match.stream_url || null;
  if (!streamURL && match.streams_list) {
    const mainStream = match.streams_list.find(s => s.main);
    if (mainStream) streamURL = mainStream.raw_url;
  }

  // Forcer game_id = 1 pour Valorant
  const gameId = 1;
  let matchStatus = statusMapping[match?.status] || 'upcoming';

  const teamAScore = match.results?.find((result) => result.team_id === teamA.id)?.score || 0;
  const teamBScore = match.results?.find((result) => result.team_id === teamB.id)?.score || 0;

  let winnerId = null;
  if (matchStatus === 'past') {
    if (teamAScore > teamBScore) winnerId = teamA.id;
    else if (teamBScore > teamAScore) winnerId = teamB.id;
  }

  // Suppression de "updated_at" car cette colonne n'existe pas dans votre table matches
  await db.query(
    `INSERT INTO matches 
      (match_id, game_id, tournament_id, team1_id, team2_id, date_match, score_team1, score_team2, winner_id, stream_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       team1_id = VALUES(team1_id),
       team2_id = VALUES(team2_id),
       date_match = VALUES(date_match),
       score_team1 = VALUES(score_team1),
       score_team2 = VALUES(score_team2),
       winner_id = VALUES(winner_id),
       stream_url = VALUES(stream_url),
       status = VALUES(status)`,
    [
      match.id,
      gameId,
      match.tournament ? match.tournament.id : null,
      teamA.id,
      teamB.id,
      formattedStartTime,
      teamAScore,
      teamBScore,
      winnerId,
      streamURL,
      matchStatus
    ]
  );
}

/**
 * Synchronisation des matchs à venir (20 premiers) depuis PandaScore vers la BDD.
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
    console.log(matches.map(m => ({ id: m.id, status: m.status })));

    for (const match of matches.slice(0, 20)) {
      await upsertMatch(match);
    }

    console.log("✅ 20 matchs enregistrés en BDD avec leurs stream URLs.");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation des matchs :", error.message);
  }
}

/**
 * Mise à jour des scores en direct pour les matchs "running".
 */
async function updateLiveMatchScores() {
  try {
    const [runningMatches] = await db.query("SELECT match_id FROM matches WHERE status = 'running'");

    if (runningMatches.length === 0) {
      console.log("✅ Aucun match en direct à mettre à jour.");
      return;
    }

    for (const matchRow of runningMatches) {
      try {
        const { data: matchData } = await apiClient.get(`valorant/matches?filter[id]=${matchRow.match_id}`);
        if (!matchData) {
          console.log(`⚠️ Aucun data retourné pour match ${matchRow.match_id}`);
          continue;
        }
        const matchInfo = Array.isArray(matchData) ? matchData[0] : matchData;
        if (!matchInfo) {
          console.log(`⚠️ Aucune info pour match ${matchRow.match_id}`);
          continue;
        }

        const teamAId = matchInfo.opponents?.[0]?.opponent?.id;
        const teamBId = matchInfo.opponents?.[1]?.opponent?.id;
        const teamAScore = matchInfo.results?.find(r => r.team_id === teamAId)?.score || 0;
        const teamBScore = matchInfo.results?.find(r => r.team_id === teamBId)?.score || 0;

        const matchStatus = matchInfo && matchInfo.status
          ? (statusMapping[matchInfo.status] || 'running')
          : 'running';

        let winnerId = null;
        if (matchStatus === 'past') {
          if (teamAScore > teamBScore) winnerId = teamAId;
          else if (teamBScore > teamAScore) winnerId = teamBId;
        }

        await db.query(
          `UPDATE matches
           SET score_team1 = ?, 
               score_team2 = ?, 
               status = ?,
               winner_id = ?
           WHERE match_id = ?`,
          [teamAScore, teamBScore, matchStatus, winnerId, matchRow.match_id]
        );

        console.log(`✅ Match ${matchRow.match_id} mis à jour: ${teamAScore} - ${teamBScore}, statut: ${matchStatus}`);
      } catch (err) {
        console.error(`❌ Erreur lors de la mise à jour du match ${matchRow.match_id} :`, err.message);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des scores en direct :", error.message);
  }
}

/**
 * Mise à jour des matchs dont les équipes sont "TBD" (team1_id ou team2_id = 0).
 */
async function updateTbdMatches() {
  try {
    const [tbdMatches] = await db.query("SELECT match_id FROM matches WHERE team1_id = 0 OR team2_id = 0");

    if (tbdMatches.length === 0) {
      console.log("✅ Aucun match avec équipes TBD à mettre à jour.");
      return;
    }

    for (const matchRow of tbdMatches) {
      try {
        const { data: matchData } = await apiClient.get(`valorant/matches?filter[id]=${matchRow.match_id}`);
        const matchInfo = Array.isArray(matchData) ? matchData[0] : matchData;
        if (matchInfo) {
          const teamA = matchInfo.opponents?.[0]?.opponent || { id: 0, name: "TBD", image_url: null };
          const teamB = matchInfo.opponents?.[1]?.opponent || { id: 0, name: "TBD", image_url: null };

          await db.query(
            `UPDATE matches
             SET team1_id = ?, 
                 team2_id = ?
             WHERE match_id = ?`,
            [teamA.id, teamB.id, matchRow.match_id]
          );

          console.log(`✅ Équipes mises à jour pour match ${matchRow.match_id}: ${teamA.name} vs ${teamB.name}`);
        }
      } catch (err) {
        console.error(`❌ Erreur lors de la mise à jour du match ${matchRow.match_id} :`, err.message);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des matchs TBD :", error.message);
  }
}

/**
 * Vérification et mise à jour des statuts des matchs.
 * Passage de "upcoming" à "running" lorsque la date du match est dépassée,
 * puis passage à "past" lorsque la date du match + durée estimée est dépassée.
 */
async function updateMatchesStatus() {
  try {
    const now = new Date();

    // Passage de "upcoming" à "running"
    const [upcomingToRunning] = await db.query(
      "SELECT match_id, date_match FROM matches WHERE status = 'upcoming' AND date_match <= ?",
      [now]
    );

    if (upcomingToRunning.length > 0) {
      console.log(`🔄 ${upcomingToRunning.length} matchs passent de upcoming à running`);
      for (const match of upcomingToRunning) {
        await db.query(
          "UPDATE matches SET status = 'running' WHERE match_id = ?",
          [match.match_id]
        );
        console.log(`✅ Match ${match.match_id} passé au statut 'running'`);
      }
    }

    // Passage de "running" à "past" (durée estimée = 2h)
    const estimatedDuration = 2 * 60 * 60 * 1000; // 2 heures en millisecondes
    const [runningMatches] = await db.query(
      "SELECT match_id, date_match FROM matches WHERE status = 'running'"
    );
    const runningToPast = runningMatches.filter(match => {
      const startTime = new Date(match.date_match);
      return now - startTime >= estimatedDuration;
    });
    for (const match of runningToPast) {
      await db.query(
        "UPDATE matches SET status = 'past' WHERE match_id = ?",
        [match.match_id]
      );
      console.log(`✅ Match ${match.match_id} passé au statut 'past'`);
    }

    // Mise à jour des scores en direct
    await updateLiveMatchScores();

    // Vérification qu'il y ait toujours 20 matchs en "upcoming"
    const [upcomingCountResult] = await db.query(
      "SELECT COUNT(*) as count FROM matches WHERE status = 'upcoming'"
    );
    const upcomingCount = upcomingCountResult[0].count;
    if (upcomingCount < 20) {
      console.log(`🔄 Seulement ${upcomingCount} matchs upcoming. Ajout de nouveaux matchs pour atteindre 20.`);
      await syncUpcomingMatchesToDB();
    }

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
