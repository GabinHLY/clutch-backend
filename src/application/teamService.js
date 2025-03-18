// teamService.js
import apiClient from '../infrastructure/apiClient.js';
import db from '../config/database.js';
import cron from 'node-cron';
import { getPlayersByTeam } from './playerService.js';

/**
 * Insère ou met à jour une équipe dans la table teams.
 */
async function upsertTeam(team) {
  try {
    await db.query(
      `INSERT INTO teams (team_id, name, region, logo_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         region = VALUES(region),
         logo_url = VALUES(logo_url)`,
      [team.id, team.name, team.location || 'Inconnue', team.image_url || null]
    );
  } catch (error) {
    console.error(`❌ Erreur lors de l'upsert de l'équipe ${team.name}:`, error.message);
  }
}

/**
 * Récupère toutes les équipes pour Valorant via l'API PandaScore et les insère en BDD.
 */
async function syncTeams() {
  try {
    const { data } = await apiClient.get('valorant/teams');
    for (const team of data) {
      await upsertTeam(team);
    }
    return data;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des équipes:', error.message);
    throw new Error("Impossible de synchroniser les équipes depuis PandaScore.");
  }
}

/**
 * Récupère toutes les équipes depuis la BDD.
 */
async function getTeams() {
  try {
    const [rows] = await db.query("SELECT * FROM teams");
    return rows;
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes depuis la BDD:", error.message);
    throw error;
  }
}

/**
 * Récupère une équipe par son ID.
 * Si elle n'existe pas en BDD, on la récupère via l'API et on l'insère.
 */
async function getTeamById(teamId) {
  try {
    const [rows] = await db.query("SELECT * FROM teams WHERE team_id = ?", [teamId]);
    if (rows.length > 0) {
      return rows[0];
    } else {
      const { data } = await apiClient.get(`valorant/teams?filter[id]=${teamId}`);
      if (data && data.length > 0) {
        const team = data[0];
        await upsertTeam(team);
        return team;
      }
      throw new Error("Équipe non trouvée.");
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'équipe ${teamId}:`, error.message);
    throw new Error(`Impossible de récupérer l'équipe ${teamId}.`);
  }
}

/**
 * Récupère le roster (la liste des joueurs) d'une équipe.
 * Ici, on récupère les joueurs depuis la BDD à l'aide de getPlayersByTeam (définie dans playerService.js).
 */
async function getTeamRoster(teamId) {
  try {
    const players = await getPlayersByTeam(teamId);
    return players;
  } catch (error) {
    console.error(`Erreur lors de la récupération du roster de l'équipe ${teamId}:`, error.message);
    throw error;
  }
}

// Synchronisation automatique des équipes toutes les 6 heures
cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('🔄 Synchronisation automatique des équipes...');
    await syncTeams();
    console.log('✅ Synchronisation des équipes terminée.');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation automatique des équipes:', error.message);
  }
});

export { syncTeams, getTeamById, upsertTeam, getTeamRoster, getTeams };
