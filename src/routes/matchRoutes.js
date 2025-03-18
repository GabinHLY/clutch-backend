// matchRoutes.js
import express from 'express';
import { 
    getMatches, 
    syncMatches, 
    updateLiveScores, 
    updateTbdTeams, 
    updateMatchStatus, 
    completeMatch, 
    getMatchesFromDB,
    addMatch 
} from '../interfaces/matchController.js';

const router = express.Router();

// Récupération des matchs depuis l'API PandaScore (upcoming, running, past)
router.get('/matches/:status', getMatches);

// Récupération des matchs depuis la BDD
router.get('/matches/db/:status', getMatchesFromDB);

// Synchronisation des matchs à venir avec la BDD
router.post('/matches/sync', syncMatches);

// Mise à jour des scores en direct pour les matchs en cours
router.put('/matches/live-scores', updateLiveScores);

// Mise à jour des équipes pour les matchs TBD
router.put('/matches/update-tbd', updateTbdTeams);

// Mise à jour automatique du statut des matchs
router.put('/matches/update-status', updateMatchStatus);

// Finalisation manuelle d'un match
router.patch('/matches/complete', completeMatch);

// Ajout ou mise à jour manuelle d'un match dans la BDD
router.post('/matches/add', addMatch);

export default router;
