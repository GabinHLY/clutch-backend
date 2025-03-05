import express from 'express';
import { getAllTeams, getTeam, getRoster } from '../interfaces/teamController.js';

const router = express.Router();

router.get('/teams', getAllTeams);
router.get('/teams/:id', getTeam);
router.get('/teams/:id/roster', getRoster);

export default router;
