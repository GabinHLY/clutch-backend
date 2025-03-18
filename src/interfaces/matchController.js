// matchController.js
import {
    getMatchesByStatus,
    syncUpcomingMatchesToDB,
    updateLiveMatchScores,
    updateTbdMatches,
    updateMatchesStatus,
    upsertMatch
  } from '../application/matchService.js';
  import db from '../config/database.js';
  
  /**
   * Récupération des matchs depuis l'API PandaScore selon un statut donné.
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
   * Synchronisation des matchs à venir avec la BDD.
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
   * Mise à jour des scores en direct.
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
   * Mise à jour des équipes pour les matchs TBD.
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
   * Mise à jour automatique du statut des matchs.
   */
  const updateMatchStatus = async (req, res) => {
    try {
      await updateMatchesStatus();
      res.status(200).json({ message: "Statut des matchs mis à jour." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  /**
   * Finalisation manuelle d'un match.
   */
  const completeMatch = async (req, res) => {
    try {
      const { matchId, winnerId } = req.body;
  
      if (!matchId || !winnerId) {
        return res.status(400).json({ message: "matchId et winnerId sont requis." });
      }
  
      await db.query(
        "UPDATE matches SET status = 'past', winner_id = ? WHERE match_id = ?",
        [winnerId, matchId]
      );
  
      res.status(200).json({ message: `Match ${matchId} terminé, winner_id: ${winnerId}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  /**
   * Récupération des matchs depuis la BDD avec JOIN pour enrichir team1 et team2.
   */
  const getMatchesFromDB = async (req, res) => {
    try {
      const { status } = req.params;
      if (!['upcoming', 'running', 'past'].includes(status)) {
        return res.status(400).json({ message: "Statut invalide. Utilisez 'upcoming', 'running' ou 'past'." });
      }
  
      const [rows] = await db.query(
        `
        SELECT m.*,
               t1.team_id AS t1_id, t1.name AS t1_name, t1.logo_url AS t1_logo,
               t2.team_id AS t2_id, t2.name AS t2_name, t2.logo_url AS t2_logo
        FROM matches m
        LEFT JOIN teams t1 ON m.team1_id = t1.team_id
        LEFT JOIN teams t2 ON m.team2_id = t2.team_id
        WHERE m.status = ?
        ORDER BY m.date_match ASC
        LIMIT 20
        `,
        [status]
      );
  
      const matches = rows.map(row => ({
        id: row.match_id,
        date_match: row.date_match,
        stream_url: row.stream_url,
        status: row.status,
        score_team1: row.score_team1,
        score_team2: row.score_team2,
        winner_id: row.winner_id,
        team1: {
          id: row.t1_id,
          name: row.t1_name,
          logo: row.t1_logo,
          score: row.score_team1
        },
        team2: {
          id: row.t2_id,
          name: row.t2_name,
          logo: row.t2_logo,
          score: row.score_team2
        }
      }));
  
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  /**
   * Ajout ou mise à jour manuelle d'un match dans la BDD.
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
  