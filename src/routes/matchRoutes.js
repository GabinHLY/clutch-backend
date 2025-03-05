// matchRoutes.js
import express from 'express';
import { 
    getUpcomingMatches, 
    getRunningMatches, 
    getPastMatches, 
    getVctMatches, 
    syncUpcomingMatchesToDB, 
    updateMatchStatus, 
    completeMatch, 
    getMatchesFromDB,
    autoSyncMatchesController // importer la nouvelle fonction
} from '../interfaces/matchController.js';

const router = express.Router();

router.get('/matches/upcoming', getUpcomingMatches);
router.get('/matches/running', getRunningMatches);
router.get('/matches/past', getPastMatches);
router.get('/matches/vct', getVctMatches);

// Ancienne synchro manuelle (si besoin)
router.post('/matches/sync', syncUpcomingMatchesToDB);

// Mise à jour manuelle de 'upcoming' à 'ongoing'
router.put('/matches/update', updateMatchStatus);

// Finalisation manuelle de 'ongoing' à 'finished'
router.patch('/matches/complete', completeMatch);

// Récupération de 20 matchs 'upcoming' depuis la BDD
router.get('/matches/upcoming-db', getMatchesFromDB);

// Nouvelle route pour la synchro automatique (optionnelle)
router.post('/matches/auto-sync', autoSyncMatchesController);

export default router;
