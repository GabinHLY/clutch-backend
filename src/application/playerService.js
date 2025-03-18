// playerService.js
import apiClient from '../infrastructure/apiClient.js';
import db from '../config/database.js';

/**
 * upsertPlayer - Insère ou met à jour un joueur dans la table players.
 * On utilise uniquement les colonnes player_id, team_id et nickname.
 */
async function upsertPlayer(player, teamId) {
  try {
    await db.query(
      `INSERT INTO players (player_id, team_id, nickname)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         team_id = VALUES(team_id),
         nickname = VALUES(nickname)`,
      [
        player.id,
        teamId,
        player.name
      ]
    );
  } catch (error) {
    console.error(`❌ Erreur lors de l'upsert du joueur ${player.name}:`, error.message);
  }
}

/**
 * syncPlayersByTeam - Récupère les joueurs d'une équipe via l'API PandaScore en filtrant par team_id
 * et les insère en BDD.
 */
async function syncPlayersByTeam(teamId) {
  try {
    const { data } = await apiClient.get(`valorant/players?filter[team_id]=${teamId}`);
    for (const player of data) {
      await upsertPlayer(player, teamId);
    }
    return data;
  } catch (error) {
    console.error(`Erreur lors de la synchronisation des joueurs pour l'équipe ${teamId}:`, error.message);
    throw new Error(`Impossible de synchroniser les joueurs pour l'équipe ${teamId}.`);
  }
}

/**
 * getPlayerById - Récupère un joueur par son ID depuis la BDD.
 */
async function getPlayerById(playerId) {
  try {
    const [rows] = await db.query("SELECT * FROM players WHERE player_id = ?", [playerId]);
    if (rows.length > 0) {
      return rows[0];
    } else {
      const { data } = await apiClient.get(`valorant/players?filter[id]=${playerId}`);
      if (data && data.length > 0) {
        const player = data[0];
        await upsertPlayer(player, player.team_id);
        return player;
      }
      throw new Error("Joueur non trouvé.");
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du joueur ${playerId}:`, error.message);
    throw new Error(`Impossible de récupérer le joueur ${playerId}.`);
  }
}

/**
 * getPlayersByTeam - Récupère tous les joueurs d'une équipe depuis la BDD.
 */
async function getPlayersByTeam(teamId) {
  try {
    const [rows] = await db.query("SELECT * FROM players WHERE team_id = ?", [teamId]);
    return rows;
  } catch (error) {
    console.error(`Erreur lors de la récupération des joueurs pour l'équipe ${teamId}:`, error.message);
    throw new Error(`Impossible de récupérer les joueurs pour l'équipe ${teamId}.`);
  }
}

export { upsertPlayer, syncPlayersByTeam, getPlayerById, getPlayersByTeam };
