// matchController.js
import { 
    getMatchesByStatus, 
    getUpcomingVctMatches, 
    getUpcomingMatchesFromDB,
    autoSyncMatches // on importe la nouvelle fonction
} from '../application/matchService.js';
import db from '../config/database.js';

/**
 * Récupération des matchs "upcoming" via l'API PandaScore (pas la BDD)
 */
const getUpcomingMatches = async (req, res) => {
    try {
        const matches = await getMatchesByStatus('upcoming');
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupération des matchs "running" via l'API
 */
const getRunningMatches = async (req, res) => {
    try {
        const matches = await getMatchesByStatus('running');
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupération des matchs "past" via l'API
 */
const getPastMatches = async (req, res) => {
    try {
        const matches = await getMatchesByStatus('past');
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupération des matchs VCT
 */
const getVctMatches = async (req, res) => {
    try {
        const matches = await getUpcomingVctMatches();
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Ancienne synchro manuelle : récupère 20 prochains matchs "upcoming" et les met en BDD
 */
const syncUpcomingMatchesToDB = async () => {
    try {
        const matches = await getMatchesByStatus('upcoming');
        for (const match of matches.slice(0, 20)) {
            await db.query(
                `INSERT INTO matches (id, game, team_a, team_b, start_time, status) 
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = ?`,
                [match.id, match.game, match.team_a.name, match.team_b.name, match.start_time, 'upcoming', 'upcoming']
            );
        }
        console.log("✅ 20 prochains matchs à venir enregistrés en base de données");
    } catch (error) {
        console.error("❌ Erreur lors de la synchronisation des matchs :", error.message);
    }
};

/**
 * Mise à jour manuelle des statuts (route PUT /matches/update)
 * -> Passe de 'upcoming' à 'ongoing' si l'heure est dépassée
 */
const updateMatchStatus = async (req, res) => {
    try {
      const [matches] = await db.query(
        "SELECT id, start_time FROM matches WHERE status = 'upcoming'"
      );
      const now = new Date();
  
      for (const match of matches) {
        if (new Date(match.start_time) <= now) {
          await db.query(
            "UPDATE matches SET status = 'ongoing' WHERE id = ?",
            [match.id]
          );
        }
      }
      console.log("✅ Statut des matchs mis à jour.");
      res.status(200).json({ message: "Statut des matchs mis à jour" });
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour des statuts :", error.message);
      res.status(500).json({ error: error.message });
    }
};
  
/**
 * Finalisation manuelle (route PATCH /matches/complete)
 * -> Passe un match de 'ongoing' à 'finished' et enregistre le résultat
 */
const completeMatch = async (req, res) => {
    try {
      const { matchId, result } = req.body;
  
      if (!matchId || !result) {
        return res.status(400).json({ message: "matchId et result sont requis" });
      }
  
      await db.query(
        "UPDATE matches SET status = 'finished', result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [result, matchId]
      );
  
      console.log(`✅ Match ${matchId} terminé avec le résultat : ${result}`);
      res.status(200).json({ message: `Match ${matchId} terminé`, result });
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du match terminé :", error.message);
      res.status(500).json({ error: error.message });
    }
};

/**
 * Récupérer les matchs 'upcoming' depuis la BDD (route GET /matches/upcoming-db)
 */
const getMatchesFromDB = async (req, res) => {
    try {
        const matches = await getUpcomingMatchesFromDB();
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Nouvelle route (optionnelle) pour déclencher la synchro automatique
 * -> Appelle autoSyncMatches()
 */
const autoSyncMatchesController = async (req, res) => {
    try {
        await autoSyncMatches();
        res.status(200).json({ message: "Synchronisation automatique effectuée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { 
    getUpcomingMatches, 
    getRunningMatches, 
    getPastMatches, 
    getVctMatches, 
    syncUpcomingMatchesToDB, 
    updateMatchStatus, 
    completeMatch, 
    getMatchesFromDB,
    autoSyncMatchesController // on exporte la nouvelle fonction
};
