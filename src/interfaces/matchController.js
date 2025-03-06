// matchController.js
import { 
    getMatchesByStatus, 
    syncUpcomingMatchesToDB, 
    updateLiveMatchScores, 
    updateTbdMatches, 
    upsertMatch
} from '../application/matchService.js';
import db from '../config/database.js';

/**
 * Récupérer les matchs depuis l'API PandaScore selon un statut donné
 */
const getMatches = async (req, res) => {
    try {
        const { status } = req.params;
        if (!['upcoming', 'running', 'past'].includes(status)) {
            return res.status(400).json({ message: "Statut invalide. Utilisez 'upcoming', 'running' ou 'past'." });
        }
        const matches = await getMatchesByStatus(status);
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Synchronisation des matchs à venir
 */
const syncMatches = async (req, res) => {
    try {
        await syncUpcomingMatchesToDB();
        res.status(200).json({ message: "Mise à jour des matchs à venir effectuée." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Mise à jour des scores en direct
 */
const updateLiveScores = async (req, res) => {
    try {
        await updateLiveMatchScores();
        res.status(200).json({ message: "Mise à jour des scores en direct effectuée." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Mise à jour des équipes pour les matchs TBD
 */
const updateTbdTeams = async (req, res) => {
    try {
        await updateTbdMatches();
        res.status(200).json({ message: "Mise à jour des équipes TBD effectuée." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Mise à jour du statut des matchs (upcoming → ongoing)
 */
const updateMatchStatus = async (req, res) => {
    try {
        const now = new Date();
        await db.query(
            "UPDATE matches SET status = 'ongoing' WHERE status = 'upcoming' AND start_time <= ?",
            [now]
        );
        res.status(200).json({ message: "Statut des matchs mis à jour." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Finalisation d'un match (ongoing → finished)
 */
const completeMatch = async (req, res) => {
    try {
        const { matchId, result } = req.body;

        if (!matchId || !result) {
            return res.status(400).json({ message: "matchId et result sont requis." });
        }

        await db.query(
            "UPDATE matches SET status = 'finished', result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [result, matchId]
        );

        res.status(200).json({ message: `Match ${matchId} terminé`, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupérer les matchs depuis la BDD selon leur statut
 */
const getMatchesFromDB = async (req, res) => {
    try {
        const { status } = req.params;
        if (!['upcoming', 'ongoing'].includes(status)) {
            return res.status(400).json({ message: "Statut invalide. Utilisez 'upcoming' ou 'ongoing'." });
        }

        const [matches] = await db.query(
            `SELECT * FROM matches WHERE status = ? ORDER BY start_time ASC LIMIT 20`,
            [status]
        );
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Ajouter ou mettre à jour un match en BDD
 */
const addMatch = async (req, res) => {
    try {
        const match = req.body;
        if (!match || !match.id) {
            return res.status(400).json({ message: "Les informations du match sont incomplètes." });
        }

        await upsertMatch(match);
        res.status(200).json({ message: `Match ${match.id} ajouté/mis à jour avec succès.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { 
    getMatches, 
    syncMatches,
    updateLiveScores,
    updateTbdTeams,
    updateMatchStatus, 
    completeMatch, 
    getMatchesFromDB,
    addMatch
};
