import apiClient from '../infrastructure/apiClient.js';
import db from '../config/database.js';
import cron from 'node-cron';

// Récupérer toutes les équipes d'un jeu spécifique
async function getTeams(game) {
    try {
        const { data } = await apiClient.get(`${game}/teams`);
        return data.map((team) => ({
            id: team.id,
            name: team.name,
            slug: team.slug,
            logo: team.image_url || null,
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des équipes pour ${game} :`, error.message);
        throw new Error(`Impossible de récupérer les équipes pour ${game} depuis PandaScore.`);
    }
}

// Récupérer une équipe par son ID
async function getTeamById(teamId) {
    try {
        const { data } = await apiClient.get(`teams/${teamId}`);
        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            logo: data.image_url || null,
            region: data.location || 'Inconnue',
            players: data.players?.map(player => ({
                id: player.id,
                name: player.name,
                image: player.image_url || null,
            })) || [],
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'équipe ${teamId} :`, error.message);
        throw new Error(`Impossible de récupérer l'équipe ${teamId} depuis PandaScore.`);
    }
}

// Récupérer le roster d’une équipe en fonction de son ID et l'enregistrer en base de données
async function getTeamRoster(teamId) {
    try {
        const { data } = await apiClient.get(`teams/${teamId}`);
        if (!data.players || data.players.length === 0) {
            return [];
        }

        const roster = data.players
            .sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at))
            .slice(0, 5)
            .map(player => ({
                id: player.id,
                name: player.name,
                image: player.image_url || null
            }));

        // Sauvegarde ou mise à jour de l'équipe en base de données
        await db.query(
            `INSERT INTO equipe (id, nom, roster) VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE roster = ?, date_mise_a_jour = CURRENT_TIMESTAMP`,
            [teamId, data.name, JSON.stringify(roster), JSON.stringify(roster)]
        );

        return roster;
    } catch (error) {
        console.error(`Erreur lors de la récupération du roster de l'équipe ${teamId} :`, error.message);
        throw new Error(`Impossible de récupérer et enregistrer le roster de l'équipe ${teamId}.`);
    }
}

// Automatisation de la mise à jour des rosters toutes les 6 heures
cron.schedule('0 */6 * * *', async () => {
    try {
        console.log('🔄 Mise à jour automatique des rosters des équipes...');
        const teams = await getTeams('valorant');
        for (const team of teams) {
            await getTeamRoster(team.id);
        }
        console.log('✅ Mise à jour des rosters terminée.');
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour automatique des rosters :', error.message);
    }
});

export { getTeams, getTeamById, getTeamRoster };
