import express from 'express';
import { getUpcomingMatches, getRunningMatches, getPastMatches, getVctMatches, syncUpcomingMatchesToDB, updateMatchStatus, completeMatch, getMatchesFromDB } from '../interfaces/matchController.js';

const router = express.Router();

router.get('/matches/upcoming', getUpcomingMatches);
router.get('/matches/running', getRunningMatches);
router.get('/matches/past', getPastMatches);
router.get('/matches/vct', getVctMatches);
router.post('/matches/sync', syncUpcomingMatchesToDB);
router.post('/matches/update', updateMatchStatus);
router.post('/matches/complete', completeMatch);
router.get('/matches/upcoming-db', getMatchesFromDB);

export default router;
