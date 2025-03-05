import { getMatchesByStatus, getUpcomingVctMatches, getUpcomingMatchesFromDB } from '../application/matchService.js';
import db from '../config/database.js';

const getUpcomingMatches = async (req, res) => {
    try {
        const matches = await getMatchesByStatus('upcoming');
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRunningMatches = async (req, res) => {
    try {
        const matches = await getMatchesByStatus('running');
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPastMatches = async (req, res) => {
    try {
        const matches = await getMatchesByStatus('past');
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getVctMatches = async (req, res) => {
    try {
        const matches = await getUpcomingVctMatches();
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const syncUpcomingMatchesToDB = async () => {
    try {
        const matches = await getMatchesByStatus('upcoming');
        for (const match of matches.slice(0, 20)) {
            await db.query(
                `INSERT INTO matches (id, game, team_a, team_b, start_time, status) VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = ?`,
                [match.id, match.game, match.team_a.name, match.team_b.name, match.start_time, 'upcoming', 'upcoming']
            );
        }
        console.log("✅ 20 prochains matchs à venir enregistrés en base de données");
    } catch (error) {
        console.error("❌ Erreur lors de la synchronisation des matchs :", error.message);
    }
};

const updateMatchStatus = async () => {
    try {
        const [matches] = await db.query("SELECT id, start_time FROM matches WHERE status = 'upcoming'");
        const now = new Date();

        for (const match of matches) {
            if (new Date(match.start_time) <= now) {
                await db.query("UPDATE matches SET status = 'ongoing' WHERE id = ?", [match.id]);
            }
        }
        console.log("✅ Statut des matchs mis à jour.");
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des statuts des matchs :", error.message);
    }
};

const completeMatch = async (matchId, result) => {
    try {
        await db.query("UPDATE matches SET status = 'finished', result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [result, matchId]);
        console.log(`✅ Match ${matchId} terminé avec le résultat : ${result}`);
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du match terminé :", error.message);
    }
};

const getMatchesFromDB = async (req, res) => {
    try {
        const matches = await getUpcomingMatchesFromDB();
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { getUpcomingMatches, getRunningMatches, getPastMatches, getVctMatches, syncUpcomingMatchesToDB, updateMatchStatus, completeMatch, getMatchesFromDB };
